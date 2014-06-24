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
     * @property {jQuery} options.element 如果需要容器包着 trigger 和 menu, 可以设置主元素
     *                                    openClass 会优先作用于它，否则作用于 trigger
     * @property {jQuery} options.trigger 点击触发下拉菜单显示的元素
     * @property {jQuery} options.menu 下拉菜单元素
     * @property {string=} options.value 当前选中的值
     * @property {string} options.itemSelector 菜单项的选择器，默认是选择具有 options.valueAttr 属性的元素
     *                                         查找方式是 menu.find(itemSelector)
     * @property {string=} options.textAttr 读取 text 的元素属性，没有则读取元素 innerHTML
     * @property {string=} options.valueAttr 读取 value 的元素属性，必须设置这个选项，至少要在 defaultOptions 设置
     * @property {string=} options.itemActiveClass 菜单项选中状态的 class，可提升用户体验
     * @property {string=} options.openClass 展开状态的 class
     *
     * @property {Function=} options.showMenu 可自定义显示动画，默认直接显示
     * @property {Function=} options.hideMenu 可自定义隐藏动画，默认直接隐藏
     *
     * @property {Function=} options.onOpen
     * @property {Function=} options.onClose
     *
     * @property {Function=} options.onChange 选中菜单项触发
     * @argument {Object} options.onChange.data
     * @property {string} options.onChange.data.text
     * @property {string} options.onChange.data.value
     * @property {Function=} options.setText 选中菜单项后设置 trigger 文本的方法
     * @argument {Object} options.onChange.data
     * @property {string} options.onChange.data.text
     * @property {string} options.onChange.data.value
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

            var valueAttr = me.valueAttr;
            var itemSelector = me.itemSelector;
            if (!itemSelector) {
                itemSelector = me.itemSelector
                             = '[' + valueAttr +']';
            }

            me.cache = {
                popup: createPopup(me)
            };

            var menu = me.menu;

            var value = me.value;
            if (value == null) {
                value = menu.find('.' + me.itemActiveClass)
                            .attr(valueAttr);
            }

            if (value != null) {
                me.setValue(value, true);
            }

            menu.on('click', itemSelector, me, clickItem);
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
         * @param {boolean=} silence 是否不出发 onChange 事件，默认为 false
         */
        setValue: function (value, silence) {

            var me = this;
            var menu = me.menu;
            var target = menu.find('[' + me.valueAttr + '="' + value + '"]');

            if (target.size() === 1) {

                me.value = value;

                var itemActiveClass = me.itemActiveClass;
                if (itemActiveClass) {
                    menu.find('.' + itemActiveClass).removeClass(itemActiveClass);
                    target.addClass(itemActiveClass);
                }

                var data = {
                    value: target.attr(me.valueAttr),
                    text: target.attr(me.textAttr)
                };

                if (typeof data.text !== 'string') {
                    data.text = target.html();
                }

                if (typeof me.setText === 'function') {
                    me.setText(data);
                }

                if (!silence && $.isFunction(me.onChange)) {
                    me.onChange(data);
                }
            }
        },

        /**
         * 显示菜单
         */
        showMenu: function () {
            this.cache.popup.show();
        },

        /**
         * 隐藏菜单
         */
        hideMenu: function () {
            this.cache.popup.hide();
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            me.menu.off('click', clickItem);
            me.cache.popup.dispose();

            me.cache =
            me.trigger =
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
        textAttr: 'data-text',
        valueAttr: 'data-value',
        itemActiveClass: 'item-active',
        openClass: 'select-open',

        showMenu: function () {
            this.menu.show();
        },
        hideMenu: function () {
            this.menu.hide();
        }
    };

    /**
     * 创建 Popup 实例
     *
     * @inner
     * @param {Select} select
     * @return {Popup}
     */
    function createPopup(select) {

        var main = select.element || select.trigger;
        var openClass = select.openClass;

        var showMenu = select.showMenu;
        var hideMenu = select.hideMenu;

        delete select.showMenu;
        delete select.hideMenu;

        return new Popup({
            trigger: select.trigger,
            element: select.menu,
            showBy: 'click',
            hideBy: 'blur',
            show: function () {
                showMenu.call(select);
            },
            hide: function () {
                hideMenu.call(select);
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
        select.hideMenu();

        // 更新 value
        var value = $(e.currentTarget).attr(select.valueAttr);

        if (value != null) {
            select.setValue(value);
        }
        else if ($.isFunction(select.onClickItem)) {
            select.onClickItem(e);
        }

        // 如果 target 是 a，需要禁用默认行为
        return false;
    }


    return Select;

});