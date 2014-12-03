/**
 * @file AutoComplete
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 90%
     */

    var timer = require('../function/timer');
    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');

    var Input = require('../helper/Input');
    var Popup = require('../helper/Popup');

    /**
     * 自动补全
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 输入框元素
     * @property {jQuery} options.menu 补全菜单，菜单最好使用绝对定位，这样直接 show 出来，无需涉及定位逻辑
     *
     * @property {string=} options.itemSelector 菜单项选择器，默认是 li
     *
     * @property {number=} options.delay 长按上下键遍历的等待间隔时间，默认 60ms
     * @property {boolean=} options.includeInput 上下遍历是否包含输入框，默认包含
     * @property {boolean=} options.autoScroll 遍历时是否自动滚动，菜单出现滚动条时可开启，默认不开启
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
     * @property {string=} options.template 菜单模板
     * @property {Function=} options.renderTemplate 配置模板引擎的 render 方法，方法签名是 (data, tpl): string
     *
     * @property {Function} options.load 加载数据，可以是远程或本地数据
     * @argument {string} options.load.text 用户输入的文本
     * @argument {Function} options.load.callback 拉取完数据后的回调
     *
     * @property {Function=} options.onSelect 用户点击选中某个菜单项触发
     * @property {Function=} options.onEnter 用户按下回车触发
     * @property {Function=} options.onChange 当遍历导致输入框值变化时触发
     * @property {Function=} options.onBeforeRender 渲染菜单之前触发
     * @property {Function=} options.onAfterRender 渲染菜单之后触发
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

            // 按上下键遍历的最小索引
            me.minIndex = me.includeInput ? 0 : 1;

            // 起始索引
            me.startIndex = 0;

            // 缓存结果
            me.cache = { };

            me.input = createInput(me);
            me.popup = createPopup(me);

            var itemSelector = me.itemSelector;

            me
            .menu
            .on('mouseenter' + namespace, itemSelector, me, enterItem)
            .on('mouseleave' + namespace, itemSelector, me, leaveItem)
            .on('click' + namespace, itemSelector, me, clickItem);
        },

        /**
         * 渲染数据
         *
         * @param {Array} data
         */
        render: function (data) {

            var me = this;

            if ($.isArray(data) && data.length > 0) {

                me.emit('beforeRender');

                var menu = me.menu;
                menu.html(
                    me.renderTemplate(data, me.template)
                );

                var items = menu.find(me.itemSelector);

                data = [ ];

                items.each(
                    function (index, item) {

                        item = $(item);

                        var result = item.data();
                        if (result.text == null) {
                            result.text = item.html();
                        }

                        data.push(result);

                    }
                );

                var input = me.element;
                items.splice(0, 0, input[0]);
                data.unshift({ text: input.val() });

                // 可以在 renderTemplate 时设置某一项选中
                var index = me.startIndex;
                var className;

                var activeClass = me.activeClass;
                var activeItem = menu.find('.' + activeClass);

                if (activeItem.length === 1) {
                    index = items.index(activeItem);
                    className = activeClass;
                }

                me.maxIndex = items.length - 1;

                me.items = items;
                me.data = data;

                switchClass(me, index, className);

                me.emit('afterRender');

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

            var me = this;

            me.emit('beforeOpen');

            this.popup.open();

            me.emit('afterOpen');

        },

        /**
         * 隐藏下拉菜单
         */
        close: function () {

            var me = this;

            me.emit('beforeClose');

            this.popup.close();

            me.emit('afterClose');
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.menu.off(namespace);

            me.input.dispose();
            me.popup.dispose();

            me.element =
            me.menu =
            me.data =
            me.items =
            me.cache = null;
        }
    };

    jquerify(AutoComplete.prototype);

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
        hide: { }
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_autocomplete';

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
            50
        );

        var downTimer = timer(
            function () {
                nextItem(autoComplete);
            },
            autoComplete.delay,
            50
        );

        return new Input({
            element: autoComplete.element,
            smart: true,
            longPress: false,
            action: {
                up: function () {
                    if (!autoComplete.popup.hidden) {
                        previousItem((autoComplete));
                        timer = upTimer;
                    }
                },
                down: function () {
                    if (!autoComplete.popup.hidden) {
                        nextItem(autoComplete);
                        timer = downTimer;
                    }
                },
                enter: function () {

                    var index = autoComplete.index;

                    autoComplete.close();

                    autoComplete.emit(
                        'enter',
                        autoComplete.data[index]
                    );
                }
            },
            onBeforeLongPress: function () {
                if (timer) {
                    timer.start();
                }
            },
            onAfterLongPress: function () {
                if (timer) {
                    timer.stop();
                    timer = null;
                }
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

        var element = autoComplete.element;

        var show = autoComplete.show;
        var hide = autoComplete.hide;

        if (!show.trigger) {
            show.trigger = 'focus';
        }
        if (!hide.trigger) {
            hide.trigger = 'click';
        }

        var animation = show.animation;
        if ($.isFunction(animation)) {
            show.animation = $.proxy(animation, autoComplete);
        }

        animation = hide.animation;
        if ($.isFunction(animation)) {
            hide.animation = $.proxy(animation, autoComplete);
        }

        return new Popup({
            element: element,
            layer: autoComplete.menu,
            show: show,
            hide: hide,
            onBeforeShow: function (e) {
                // 通过元素 focus 触发
                if ('eventPhase' in e) {
                    suggest(autoComplete);
                    return false;
                }
            },
            onBeforeHide: function (e) {

                var result;

                // 点击 input 不触发失焦隐藏
                if ('eventPhase' in e) {
                    result = e.target !== element[0];
                }

                if (result) {
                    autoComplete.index = autoComplete.startIndex;
                }

                return result;
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
        var data = cache[query];

        if (data) {
            autoComplete.render(data);
        }
        else {
            autoComplete.load(
                query,
                function (data) {
                    cache[query] = data;
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
        var index = autoComplete.items.index(this);

        activeItem(
            autoComplete,
            index
        );

        autoComplete.close();

        autoComplete.emit(
            'select',
            autoComplete.data[index]
        );

    }

    /**
     * 遍历到上一个菜单项
     *
     * @inner
     * @param {AutoComplete} autoComplete
     */
    function previousItem(autoComplete) {

        var index = autoComplete.index - 1;

        if (index < autoComplete.minIndex) {
            index = autoComplete.maxIndex;
        }

        if (autoComplete.autoScroll && index > 0) {

            var menu = autoComplete.menu;
            var item = autoComplete.items.eq(index);

            // item 在 menu 视窗区域不需要滚动
            var min = menu.scrollTop();
            var max = min + menu.height();

            var top = item.prop('offsetTop');

            if (top < min || top > max) {
                menu.scrollTop(top);
            }
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

        var index = autoComplete.index + 1;

        if (index > autoComplete.maxIndex) {
            index = autoComplete.minIndex;
        }

        if (autoComplete.autoScroll && index > 0) {

            var menu = autoComplete.menu;
            var item = autoComplete.items.eq(index);

            var menuHeight = menu.height();

            // item 在 menu 视窗区域不需要滚动
            var min = menu.scrollTop();
            var max = min + menuHeight;

            var top = item.prop('offsetTop') + item.outerHeight(true);

            if (top < min || top > max) {
                menu.scrollTop(
                    top
                  - menuHeight
                );
            }
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

        switchClass(
            autoComplete,
            index,
            autoComplete.activeClass
        );

        autoComplete
        .element
        .val(
            autoComplete.data[index].text
        );

        autoComplete.emit('change');

    }

    /**
     * 鼠标移入菜单项
     *
     * @inner
     * @param {Event} e
     */
    function enterItem(e) {

        var autoComplete = e.data;
        var items = autoComplete.items;
        var index = items.index(this);

        switchClass(
            autoComplete,
            index,
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

        if (autoComplete.className === autoComplete.hoverClass) {
            switchClass(
                autoComplete,
                autoComplete.startIndex
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

        var items = autoComplete.items;
        var className = autoComplete.className;

        if (className) {
            items
            .eq(autoComplete.index)
            .removeClass(className);
        }

        if (newClass) {
            items
            .eq(newIndex)
            .addClass(newClass);
        }

        autoComplete.index = newIndex;
        autoComplete.className = newClass;
    }


    return AutoComplete;

});
