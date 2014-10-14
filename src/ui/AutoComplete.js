/**
 * @file AutoComplete
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var lifeCycle = require('../function/lifeCycle');
    var timer = require('../function/timer');
    var Input = require('../helper/Input');
    var Popup = require('../helper/Popup');

    /**
     * 自动补全
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 输入框元素
     * @property {jQuery} options.menu 补全菜单，菜单最好使用相对定位，这样直接 show 出来，无需涉及定位逻辑
     *
     * @property {string} options.itemSelector 菜单项选择器，默认是 li
     *
     * @property {number=} options.delay 长按上下键遍历的等待间隔时间
     * @property {boolean=} options.includeInput 上下遍历是否包含输入框
     *
     * @property {string=} options.hoverClass 菜单项 hover 时的 className
     * @property {string=} options.activeClass 菜单项 active 时的 className
     *
     * @property {Object} options.show
     * @property {number=} options.show.delay 显示延时
     * @property {Function=} options.show.animation 显示动画
     *
     * @property {Object} options.hide
     * @property {number=} options.hide.delay 隐藏延时
     * @property {Function=} options.hide.animation 隐藏动画
     *
     * @property {string=} options.itemTemplate 菜单项模板，简单列表用这个够了
     * @property {string=} options.menuTemplate 菜单模板，如果不是简单的列表，需配置此项
     * @property {Function=} options.renderTemplate 配置模板引擎的 render 方法，方法签名是 (tpl, data): string
     *
     * @property {Function=} options.parse 解析菜单项元素数据，返回值必须包含 text 属性
     * @argument {jQuery} options.parse.item 菜单项元素
     *
     * @property {Function} options.load 加载数据，可以是远程或本地数据
     * @argument {string} options.load.text 用户输入的文本
     * @argument {Function} options.load.callback 拉取完数据后的回调
     *
     * @property {Function} options.onSelect 用户点击选中某个菜单项触发
     * @property {Function} options.onEnter 用户按下回车触发
     */
    function AutoComplete(options) {
        return lifeCycle.init(this, options);
    }

    AutoComplete.prototype = {

        constructor: AutoComplete,

        type: 'AutoComplete',

        /**
         * 初始化
         */
        init: function () {

            var me = this;

            var cache = me.cache
                      = {
                            // 按上下键遍历的最小索引
                            min: me.includeInput ? 0 : 1,
                            // 起始索引
                            start: 0,
                            // 缓存结果
                            result: { }
                        };

            cache.input = createInput(me);
            cache.popup = createPopup(me);

            var itemSelector = me.itemSelector;

            me.menu
                .on('mouseenter' + namespace, itemSelector, me, enterItem)
                .on('mouseleave' + namespace, itemSelector, me, leaveItem)
                .on('click' + namespace, me.itemSelector, me, clickItem);
        },

        /**
         * 渲染数据
         *
         * @param {Array} data
         */
        render: function (data) {

            var me = this;

            if ($.isArray(data) && data.length > 0) {

                var cache = me.cache;
                if (cache.items) {
                    cache.items.off(namespace);
                }

                var render = me.renderTemplate;
                var html;
                if (me.itemTemplate) {
                    html = $.map(
                               data,
                               function (item) {
                                   return render(me.itemTemplate, item);
                               }
                           ).join('');
                }
                else {
                    html = render(me.menuTemplate, data);
                }


                var menu = me.menu;
                menu.html(html);

                var items = cache.items
                          = menu.find(me.itemSelector);

                var data = cache.data
                           = items.map(
                                 function (index, item) {
                                     return me.parse($(item));
                                 }
                             );

                var input = me.element;
                items.splice(0, 0, input[0]);
                data.splice(0, 0, input.val());

                cache.index = cache.start;
                cache.max = items.length - 1;

                me.open();
            }
            else {
                me.close();
            }
        },

        /**
         * 显示下拉菜单
         */
        open: function () {
            this.cache.popup.open();
        },

        /**
         * 隐藏下拉菜单
         */
        close: function () {
            this.cache.popup.close();
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            var cache = me.cache;
            if (cache.items) {
                cache.items = null;
            }

            me.menu.off(namespace);

            cache.input.dispose();
            cache.popup.dispose();

            me.element =
            me.menu =
            me.cache = null;
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    AutoComplete.defaultOptions = {
        delay: 60,
        includeInput: true,
        itemSelector: 'li',
        show: { },
        hide: { },
        parse: function (element) {
            return {
                text: element.html()
            };
        }
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble-ui-autocomplete';

    /**
     * 用 Input 处理按键
     *
     * @inner
     * @param {AutoComplete} autoComplete
     * @return {Input}
     */
    function createInput(autoComplete) {

        var upTimer = timer(
            function () {
                previousItem(autoComplete);
            },
            autoComplete.delay,
            400
        );

        var downTimer = timer(
            function () {
                nextItem(autoComplete);
            },
            autoComplete.delay,
            400
        );

        return new Input({

            element: autoComplete.element,
            smart: true,
            longPress: false,
            action: {
                up: upTimer.start,
                down: downTimer.start,
                enter: function () {
                    trigger(autoComplete, 'onEnter');
                    autoComplete.close();
                }
            },
            onKeyUp: function () {
                upTimer.stop();
                downTimer.stop();
            },
            onChange: function () {
                suggest(autoComplete);
            }
        });
    }

    /**
     * 用 Popup 处理提示层的显示隐藏逻辑
     *
     * @inner
     * @param {AutoComplete} autoComplete
     * @return {Popup}
     */
    function createPopup(autoComplete) {

        var input = autoComplete.element;

        var show = autoComplete.show;
        var hide = autoComplete.hide;

        if (!show.trigger) {
            show.trigger = 'focus';
        }
        if (!hide.trigger) {
            hide.trigger = 'click';
        }

        return new Popup({
            element: input,
            layer: autoComplete.menu,
            scope: autoComplete,
            show: show,
            hide: hide,
            onBeforeShow: function (event) {
                if (event) {
                    suggest(autoComplete);
                    return false;
                }
                else {
                    var cache = autoComplete.cache;
                    cache.index = cache.start;
                }
            },
            onBeforeHide: function (event) {
                // 点击 input 不触发失焦隐藏
                if (event) {
                    return event.target !== input[0];
                }
            }
        });
    }

    /**
     * 触发 suggestion
     *
     * @inner
     * @param {AutoComplete} autoComplete
     */
    function suggest(autoComplete) {

        var cache = autoComplete.cache;
        var query = $.trim(autoComplete.element.val());
        var data = cache.result[query];

        if (data) {
            autoComplete.render(data);
        }
        else {
            autoComplete.load(
                query,
                function (data) {
                    cache.result[query] = data;
                    autoComplete.render(data);
                }
            );
        }
    }

    /**
     * 点击菜单项
     *
     * @inner
     * @param {Event} e
     */
    function clickItem(e) {

        var autoComplete = e.data;

        activeItem(
            autoComplete,
            autoComplete.cache.items.index(e.currentTarget)
        );

        autoComplete.close();
        trigger(autoComplete, 'onSelect');
    }

    /**
     * 遍历到上一个菜单项
     *
     * @inner
     * @param {AutoComplete} autoComplete
     */
    function previousItem(autoComplete) {

        var cache = autoComplete.cache;

        var index = cache.index - 1;
        if (index < cache.min) {
            index = cache.max;
        }

        activeItem(autoComplete, index);
    }

    /**
     * 遍历到下一个菜单项
     *
     * @inner
     * @param {AutoComplete} autoComplete
     */
    function nextItem(autoComplete) {

        var cache = autoComplete.cache;

        var index = cache.index + 1;
        if (index > cache.max) {
            index = cache.min;
        }

        activeItem(autoComplete, index);
    }

    /**
     * active 某个菜单项
     *
     * @inner
     * @param {AutoComplete} autoComplete
     * @param {number} index 选择的索引
     */
    function activeItem(autoComplete, index) {

        var className;

        if (index > 0) {
            className = autoComplete.activeClass;
        }

        switchClass(
            autoComplete,
            index,
            className
        );

        autoComplete
            .element
            .val(
                autoComplete.cache.data[index].text
            );
    }

    /**
     * 鼠标移入菜单项
     *
     * @inner
     * @param {Event} e
     */
    function enterItem(e) {

        var autoComplete = e.data;

        switchClass(
            autoComplete,
            autoComplete.cache.items.index(e.currentTarget),
            autoComplete.hoverClass
        );
    }

    /**
     * 鼠标移出菜单项
     *
     * @inner
     * @param {Event} e
     */
    function leaveItem(e) {
        var autoComplete = e.data;
        var cache = autoComplete.cache;
        if (cache.className === autoComplete.hoverClass) {
            switchClass(
                autoComplete,
                cache.start
            );
        }
    }

    /**
     * 切换 className
     *
     * @inner
     * @param {AutoComplete} autoComplete
     * @param {number} newIndex
     * @param {string=} newClass
     */
    function switchClass(autoComplete, newIndex, newClass) {

        var cache = autoComplete.cache;
        var items = cache.items;

        var className = cache.className;
        if (className) {
            items.eq(cache.index)
                 .removeClass(className);
        }

        if (newClass) {
            items.eq(newIndex)
                 .addClass(newClass);
        }

        cache.index = newIndex;
        cache.className = newClass;
    }

    /**
     * 触发对外接口
     * 因为参数相同，所以提供一个方法
     *
     * @inner
     * @param {AutoComplete} autoComplete
     * @param {string} name
     */
    function trigger(autoComplete, name) {

        if ($.isFunction(autoComplete[name])) {

            var cache = autoComplete.cache;
            var data = { };

            if (!cache.popup.hidden) {
                data.item = cache.items.eq(cache.index);
                data.data = cache.data.eq(cache.index);
            }

            autoComplete[name](data);
        }
    }


    return AutoComplete;

});
