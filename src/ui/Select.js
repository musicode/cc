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
     * @param {Function=} options.onChange 选中菜单项触发
     * @argument {Object} options.onChange.data
     * @property {string} options.onChange.data.text
     * @property {string} options.onChange.data.value
     * @param {Function=} options.setText 选中菜单项后设置 trigger 文本的方法，默认是 trigger.html(text)
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
                    hideBy: 'blur'
                })
            };

            if (me.value != null) {
                me.setValue(me.value);
            }

            menu.on('click', '[' + me.valueAttr +']', me, onClick);
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
         */
        setValue: function (value) {

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
            }
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            me.menu.off('click', onClick);
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
        setText: function (data) {
            this.trigger.html(data.text);
        }
    };

    /**
     * 点击菜单项触发
     *
     * @inner
     * @param {Event} e
     */
    function onClick(e) {

        var select = e.data;
        var target = $(e.currentTarget);

        // 处理 DOM
        select.cache.popup.hide();

        // 收集数据
        var data = {
            value: target.attr(select.valueAttr),
            text: target.attr(select.textAttr)
        };

        if (typeof data.text !== 'string') {
            data.text = target.html();
        }

        // 更新 value
        select.setValue(data.value);

        // 更新 text
        if (typeof select.setText === 'function') {
            select.setText(data);
        }

        // 触发外部接口
        if (typeof select.onChange === 'function') {
            select.onChange(data);
        }

        // 如果 target 是 a，需要禁用默认行为
        return false;
    }


    return Select;

});