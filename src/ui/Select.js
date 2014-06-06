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
     * @param {jQuery} options.trigger 点击触发下拉菜单显示的元素
     * @param {jQuery} options.menu 下拉菜单元素
     * @param {string=} options.value 当前选中的值
     * @param {string=} options.textAttr 读取 text 的元素属性，没有则读取元素 innerHTML
     * @param {string=} options.valueAttr 读取 value 的元素属性，必须设置这个选项，至少要在 defaultOptions 设置
     * @param {string=} options.activeClass 菜单项选中状态的 class，可提升用户体验
     * @param {Function=} options.onOpen
     * @param {Function=} options.onClose
     *
     * @param {Function=} options.onChange 选中菜单项触发
     * @argument {Object} options.onChange.data
     * @property {string} options.onChange.data.text
     * @property {string} options.onChange.data.value
     * @param {Function=} options.setText 选中菜单项后设置 trigger 文本的方法
     * @argument {Object} options.onChange.data
     * @property {string} options.onChange.data.text
     * @property {string} options.onChange.data.value
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
            var menu = me.menu;

            me.cache = {
                popup: new Popup({
                    trigger: me.trigger,
                    element: menu,
                    showBy: 'click',
                    hideBy: 'blur',
                    onAfterShow: me.onOpen,
                    onAfterHide: me.onClose,
                    scope: me
                })
            };

            if (me.value != null) {
                me.setValue(me.value);
            }

            menu.on('click', '[' + me.valueAttr +']', me, clickItem);
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
         * @param {boolean=} triggerChange 是否触发 change 事件
         */
        setValue: function (value, triggerChange) {

            var me = this;
            var menu = me.menu;
            var target = menu.find('[' + me.valueAttr + '="' + value + '"]');

            if (target.size() === 1) {

                me.value = value;

                var activeClass = me.activeClass;
                if (activeClass) {
                    menu.find('.' + activeClass).removeClass(activeClass);
                    target.addClass(activeClass);
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

                if (triggerChange && typeof me.onChange === 'function') {
                    me.onChange(data);
                }
            }
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
        valueAttr: 'data-value'
    };

    /**
     * 点击菜单项触发
     *
     * @inner
     * @param {Event} e
     */
    function clickItem(e) {

        var select = e.data;

        // 处理 DOM
        select.cache.popup.hide();

        // 更新 value
        select.setValue(
            $(e.currentTarget).attr(select.valueAttr),
            true
        );

        // 如果 target 是 a，需要禁用默认行为
        return false;
    }


    return Select;

});