/**
 * @file 下拉菜单
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var Popup = require('../helper/Popup');

    /**
     * 下拉菜单
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.element 如果需要容器包着 button 和 menu, 可以设置主元素
     *                                     className.open 会优先作用于它，否则作用于 button
     *
     * @property {jQuery} options.button 点击触发下拉菜单显示的元素
     * @property {jQuery} options.menu 下拉菜单元素
     * @property {string=} options.value 当前选中的值
     *
     * @property {Object=} options.attribute 属性名
     * @property {string=} options.attribute.text 读取 text 的元素属性，没有则读取元素 innerHTML
     * @property {string=} options.attribute.value 读取 value 的元素属性，必须设置这个选项，至少要在 defaultOptions 设置
     *
     * @property {Object=} options.selector 选择器
     * @property {string=} options.selector.item 菜单项的选择器，默认是选择具有 attribute.value 属性的元素
     *                                           查找方式是 menu.find(selector.item)
     *
     * @property {Object=} options.className 样式
     * @property {string=} options.className.itemActive 菜单项选中状态的 class，可提升用户体验
     * @property {string=} options.className.open 菜单展开状态的 class
     *
     * @property {Object=} options.animation 动画
     * @property {Function=} options.animation.open 展开动画
     * @property {Function=} options.animation.close 关闭动画
     *
     * @property {Function=} options.onOpen 菜单展开时触发
     * @property {Function=} options.onClose 菜单关闭时触发
     *
     * @property {Function=} options.onChange 选中菜单项触发
     * @argument {Object} options.onChange.data
     * @property {string} options.onChange.data.text
     * @property {string} options.onChange.data.value
     *
     * @property {Function=} options.setText 选中菜单项后设置 button 文本的方法
     * @argument {Object} options.setText.data
     * @property {string} options.setText.data.text
     * @property {string} options.setText.data.value
     *
     * @property {Function=} options.onClickItem 如果没有使用 valueAttr，而是想要完全自定义选中逻辑，可配置此方法
     */
    function Select(options) {
        $.extend(this, Select.defaultOptions, options);
        this.init();
    }

    Select.prototype = {

        constructor: Select,

        /**
         * 初始化
         *
         * @private
         */
        init: function () {

            var me = this;

            me.cache = {
                popup: createPopup(me)
            };

            var menu = me.menu;

            var value = me.value;
            var valueAttr = me.valueAttr;

            if (value == null) {
                value = menu.find('.' + me.className.itemActive)
                            .attr(valueAttr);
            }

            if (value != null) {
                me.setValue(value, { silence: true });
            }

            var itemSelector = me.selector.item;
            if (!itemSelector) {
                itemSelector = me.itemSelector
                             = '[' + valueAttr +']';
            }

            menu.on('click' + namespace, itemSelector, me, clickItem);
        },

        /**
         * 获取当前选中的值
         *
         * @return {string}
         */
        getValue: function () {
            return this.value;
        },

        /**
         * 设置当前选中的值
         *
         * @param {string} value
         * @param {Object=} options
         * @property {boolean=} options.silence 是否不出发 onChange 事件，默认为 false
         */
        setValue: function (value, options) {

            var me = this;
            var menu = me.menu;
            var target = menu.find('[' + me.valueAttr + '="' + value + '"]');

            if (target.size() === 1) {

                me.value = value;

                var activeClass = me.className.itemActive;
                if (activeClass) {
                    menu.find('.' + activeClass).removeClass(activeClass);
                    target.addClass(activeClass);
                }

                var attr = me.attribute;
                var data = {
                    text: target.attr(attr.text),
                    value: target.attr(attr.value)
                };

                if ($.type(data.text) !== 'string') {
                    data.text = target.html();
                }

                if ($.isFunction(me.setText)) {
                    me.setText(data);
                }

                options = options || { };
                if (!options.silence
                    && $.isFunction(me.onChange)
                ) {
                    me.onChange(data);
                }
            }
        },

        /**
         * 显示菜单
         */
        open: function () {
            this.cache.popup.show();
        },

        /**
         * 隐藏菜单
         */
        close: function () {
            this.cache.popup.hide();
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            me.menu.off(namespace);
            me.cache.popup.dispose();

            me.cache =
            me.button =
            me.menu = null;
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Select.defaultOptions = {
        selector: { },
        animation: { },
        attribute: {
            text: 'data-text',
            value: 'data-value'
        },
        className: {
            itemActive: 'item-active',
            open: 'select-open'
        }
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_select';

    /**
     * 创建 Popup 实例
     *
     * @inner
     * @param {Select} select
     * @return {Popup}
     */
    function createPopup(select) {

        var main = select.element || select.button;
        var openClass = select.className.open;
        var animation = select.animation;

        return new Popup({
            source: select.button,
            element: select.menu,
            scope: select,
            trigger: {
                show: 'click',
                hide: 'click'
            },
            animation: {
                show: animation.open,
                hide: animation.close
            },
            onAfterShow: function () {
                if (openClass) {
                    main.addClass(openClass);
                }
                if ($.isFunction(select.onOpen)) {
                    select.onOpen();
                }
            },
            onAfterHide: function () {
                if (openClass) {
                    main.removeClass(openClass);
                }
                if ($.isFunction(select.onClose)) {
                    select.onClose();
                }
            }
        });
    }

    /**
     * 点击菜单项触发
     *
     * @inner
     * @param {Event} e
     */
    function clickItem(e) {

        var select = e.data;

        // 处理 DOM
        select.close();

        if ($.isFunction(select.onClickItem)) {
            select.onClickItem(e);
        }
        else {
            select.setValue(
                $(e.currentTarget).attr(select.valueAttr)
            );
        }

        // 如果 target 是 a，需要禁用默认行为
        return false;
    }


    return Select;

});