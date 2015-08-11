/**
 * @file 模拟 <input type="radio" />
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');

    /**
     *
     * ## 结构
     *
     * 复选框的结构通常如下：
     *
     * <label>
     *     <input type="radio" name="city" /> 北京
     * </label>
     *
     * 好处是点击 `北京` 或 复选框，都能选中
     *
     * ## 默认选中
     *
     * 如果需要默认选中，input 可以设置为 checked，如下：
     *
     * <input type="radio" name="city" checked="checked" />
     *
     * ## 默认禁用
     *
     * 如果需要默认禁用，input 可以设置为 disabled，如下：
     *
     * <input type="radio" name="city" disabled="disabled" />
     *
     * ## 特殊性
     *
     * 单选框不同于复选框的一个地方是：
     *
     * 不能处理一个单选框，而是处理 name 属性相同的一组单选框
     *
     * 所以 Radio 必须和 BoxGroup 一起使用
     */


    /**
     * 单选框构造函数
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element <input type="radio" /> 元素
     * @property {string=} options.template 模拟单选框的模版
     * @property {string=} options.checkedClass 选中的 className
     * @property {string=} options.disabledClass 禁用的 className
     * @property {string=} options.wrapperSelector 应用 className 的元素选择器，默认是 label
     */
    function Radio(options) {
        return lifeCycle.init(this, options);
    }

    Radio.prototype = {

        constructor: Radio,

        type: 'Radio',

        /**
         * 初始化
         */
        init: function () {

            var me = this;

            var element = me.element;

            if (me.template) {
                element.hide().before(me.template);
            }

            if (element.prop('checked')) {
                me.check();
            }

            if (element.prop('disabled')) {
                me.disable();
            }

            element.on(
                'click' + namespace,
                $.proxy(me.check, me)
            );
        },

        /**
         * 选中单选框
         */
        check: function () {
            var me = this;
            me.element.prop('checked', true);
            me.setClass('add', me.checkedClass);
        },

        /**
         * 取消选中单选框
         */
        uncheck: function () {
            var me = this;
            if (!me.element.prop('checked')) {
                me.setClass('remove', me.checkedClass);
            }
        },

        /**
         * 启用单选框
         */
        enable: function () {
            var me = this;
            me.element.prop('disabled', false);
            me.setClass('remove', me.disabledClass);
        },

        /**
         * 禁用单选框
         */
        disable: function () {
            var me = this;
            me.element.prop('disabled', true);
            me.setClass('add', me.disabledClass);
        },

        /**
         * 是否选中
         *
         * @returns {boolean}
         */
        isChecked: function () {
            return this.element.prop('checked');
        },

        /**
         * 是否禁用
         *
         * @returns {boolean}
         */
        isDisabled: function () {
            return this.element.prop('disabled');
        },

        /**
         * 获取值
         *
         * @return {string}
         */
        getValue: function () {
            return this.element.val();
        },

        /**
         * 设置值
         *
         * @param {string|number} value
         */
        setValue: function (value) {
            this.element.val(value);
        },

        /**
         * 为 wrapper 元素设置 className
         *
         * @param {string} type 动作类型，可选值有 add remove
         * @param {string} className
         */
        setClass: function (type, className) {
            if (className) {
                var me = this;
                var wrapper = me.element.closest(me.wrapperSelector);
                if (wrapper.length === 1) {
                    wrapper[type + 'Class'](className);
                }
            }
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.element.off(namespace);
            me.element = null;

        }
    };

    jquerify(Radio.prototype);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Radio.defaultOptions = {
        wrapperSelector: 'label'
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_form_radio';


    return Radio;

});