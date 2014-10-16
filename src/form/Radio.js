/**
 * @file 模拟 <input type="radio" />
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');

    /**
     * 单选框的结构通常如下：
     *
     * <label>
     *     <input type="radio" name="city" /> 北京
     * </label>
     *
     * 好处是点击 `北京` 或 单选框，都能实现选中
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
     * @property {string} options.template 模拟单选框的模版
     * @property {string=} options.checkedClass 选中的 className
     * @property {string=} options.disabledClass 禁用的 className
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

            element.hide().before(me.template);

            if (element.prop('checked')) {
                me.check();
            }

            if (element.prop('disabled')) {
                me.disable();
            }

            element.on('click' + namespace, $.proxy(me.check, me));
        },

        /**
         * 选中单选框
         */
        check: function () {
            var me = this;
            var element = me.element;
            element.prop('checked', true);
            setClass(element, 'add', me.checkedClass);
        },

        /**
         * 取消选中单选框
         */
        uncheck: function () {
            var me = this;
            var element = me.element;
            if (!element.prop('checked')) {
                setClass(element, 'remove', me.checkedClass);
            }
        },

        /**
         * 启用单选框
         */
        enable: function () {
            var me = this;
            var element = me.element;
            element.prop('disabled', false);
            setClass(element, 'remove', me.disabledClass);
        },

        /**
         * 禁用单选框
         */
        disable: function () {
            var me = this;
            var element = me.element;
            element.prop('disabled', true);
            setClass(element, 'add', me.disabledClass);
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

    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_form_radio';

    /**
     * 为 label 元素设置 className
     *
     * @inner
     * @param {jQuery} element
     * @param {string} type
     * @param {string} className
     */
    function setClass(element, type, className) {
        if (className) {
            var action = type + 'Class';
            var label = element.closest('label');
            label[action](className);
        }
    }


    return Radio;

});