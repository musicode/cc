/**
 * @file AutoComplete
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var Input = require('../helper/Input');
    var Popup = require('../helper/Popup');

    /**
     * 自动补全
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.input 输入框元素
     * @property {jQuery} options.menu 补全菜单，菜单最好使用相对定位，这样直接 show 出来，无需涉及定位逻辑
     *
     * @property {number=} options.wait 长按上下键遍历的等待间隔时间
     * @property {boolean=} options.includeInput 上下遍历是否包含输入框
     *
     * @property {Object=} options.animation
     * @property {Function=} options.animation.open 展开动画
     * @property {Function=} options.animation.close 关闭动画
     *
     * @property {Object=} options.template
     * @property {string=} options.template.item 菜单项模板，简单列表用这个够了
     * @property {string=} options.template.menu 菜单模板，如果不是简单的列表，需配置此项
     * @property {Function=} options.template.render 配置模板引擎的 render 方法，方法签名是 (tpl, data): string
     *
     * @property {Object=} options.selector
     * @property {string} options.selector.item 可上下键遍历的菜单项元素选择器
     *
     * @property {Object=} options.className
     * @property {string=} options.className.itemHover 菜单项 hover 时的 className
     * @property {string=} options.className.itemActive 菜单项 active 时的 className
     *
     * @property {Function} options.load 加载数据，可以是远程或本地数据
     * @argument {string} options.load.text 用户输入的文本
     * @argument {Function} options.load.callback 拉取完数据后的回调
     *
     * @property {Function} options.parse 解析每个菜单项元素上的数据
     *                                    必须返回的字段是 text
     *
     * @property {Function} options.onSelect 用户点击选中某个菜单项触发
     * @property {Function} options.onEnter 用户按下回车触发
     */
    function AutoComplete(options) {
        $.extend(this, AutoComplete.defaultOptions, options);
        this.init();
    }

    AutoComplete.prototype = {

        constructor: AutoComplete,

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
                            data: { }
                        };

            cache.input = createInput(me);
            cache.popup = createPopup(me);

            me.menu.on(
                'click' + namespace,
                me.selector.item,
                me,
                clickItem
            );
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

                var menu = me.menu;
                menu.html(
                    renderMenu(me.template, data)
                );

                var items = cache.items
                          = menu.find(me.selector.item);

                var values = cache.values
                           = items.map(
                                 function (index, item) {
                                     return item.innerHTML;
                                 }
                             );

                // 这两个事件不支持事件代理，只能这么搞了
                items.on('mouseenter' + namespace, me, enterItem);
                items.on('mouseleave' + namespace, me, leaveItem);

                var input = me.input;
                items.splice(0, 0, input[0]);
                values.splice(0, 0, input.val());

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
            this.cache.popup.show();
        },

        /**
         * 隐藏下拉菜单
         */
        close: function () {
            this.cache.popup.hide();
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;
            var cache = me.cache;

            if (cache.items) {
                cache.items.off(namespace);
                cache.items = null;
            }

            me.menu.off(namespace);

            cache.input.dispose();
            cache.popup.dispose();

            me.input =
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
        wait: 60,
        includeInput: true,
        animation: { },
        template: { },
        className: { },
        selector: { }
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

        var longPressing = false;
        var action;
        var timer;

        return new Input({

            element: autoComplete.input,
            smart: true,
            longPress: false,
            action: {
                up: function () {
                    action = previousItem;
                    action(autoComplete);
                },
                down: function () {
                    action = nextItem;
                    action(autoComplete);
                },
                enter: function () {
                    autoComplete.close();
                    trigger(autoComplete, 'onEnter');
                }
            },
            onLongPressStart: function () {
                if (action) {
                    timer = setInterval(
                                function () {
                                    action(autoComplete);
                                },
                                autoComplete.wait
                            );
                }
            },
            onLongPressEnd: function () {
                if (action) {
                    clearInterval(timer);
                }
            },
            onKeyUp: function () {
                action = null;
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

        var input = autoComplete.input;
        var animation = autoComplete.animation;

        return new Popup({
            source: input,
            element: autoComplete.menu,
            scope: autoComplete,
            trigger: {
                show: 'focus',
                hide: 'blur'
            },
            animation: {
                show: animation.open,
                hide: animation.close
            },
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
        var query = $.trim(autoComplete.input.val());
        var data = cache.data[query];

        if (data) {
            autoComplete.render(data);
        }
        else {
            autoComplete.load(
                query,
                function (data) {
                    cache.data[query] = data;
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
            className = autoComplete.className.itemActive;
        }

        switchClass(
            autoComplete,
            index,
            className
        );

        autoComplete.input.val(
            autoComplete.cache.values[index]
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
            autoComplete.className.itemHover
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
        if (cache.className === autoComplete.className.itemHover) {
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
            autoComplete[name]({
                target: cache.items.eq(cache.index)
            });
        }
    }

    /**
     * 渲染菜单
     *
     * @inner
     * @param {Object} template
     * @property {string} template.item
     * @property {string} template.menu
     * @property {Function} template.render
     * @param {Array} data
     * @return {string}
     */
    function renderMenu(template, data) {
        var render = template.render;
        if (template.item) {
            return $.map(
                       data,
                       function (item) {
                           return render(template.item, item);
                       }
                   ).join('');
        }
        else {
            return render(template.menu, data);
        }
    }


    return AutoComplete;

});
