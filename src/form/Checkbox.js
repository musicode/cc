/**
 * @file 模拟 <input type="checkbox" />
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');

    /**
     * 复选框的结构通常如下：
     *
     * <label>
     *     <input type="checkbox" name="city" /> 北京
     * </label>
     *
     * 好处是点击 `北京` 或 复选框，都能实现 toggle
     */

    /**
     * 复选框构造函数
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element <input type="checkbox" /> 元素
     * @property {string} options.template 模拟复选框的模版
     * @property {string=} options.checkedClass 选中的 className
     * @property {string=} options.disabledClass 禁用的 className
     */
    function Checkbox(options) {
        return lifeCycle.init(this, options);
    }

    Checkbox.prototype = {

        constructor: Checkbox,

        type: 'Checkbox',

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

            element.on('click' + namespace, me, toggleCheck);

        },

        /**
         * 选中复选框
         */
        check: function () {
            var me = this;
            var element = me.element;
            element.prop('checked', true);
            setClass(element, 'add', me.checkedClass);
        },

        /**
         * 取消选中复选框
         */
        uncheck: function () {
            var me = this;
            var element = me.element;
            element.prop('checked', false);
            setClass(element, 'remove', me.checkedClass);
        },

        /**
         * 启用复选框
         */
        enable: function () {
            var me = this;
            var element = me.element;
            element.prop('disabled', false);
            setClass(element, 'remove', me.disabledClass);
        },

        /**
         * 禁用复选框
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

    jquerify(Checkbox.prototype);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Checkbox.defaultOptions = {

    };

    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery} element
     * @param {Object=} options
     * @return {Array.<Checkbox>}
     */
    Checkbox.init = function (element, options) {

        var result = [ ];

        element.each(
            function () {
                result.push(
                    new Checkbox(
                        $.extend(
                            {
                                element: $(this)
                            },
                            options
                        )
                    )
                );
            }
        );

        return result;
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_form_checkbox';

    /**
     * toggle 选中状态
     *
     * @inner
     * @param {Event} e
     */
    function toggleCheck(e) {

        var checkbox = e.data;

        if (checkbox.element.prop('checked')) {
            checkbox.check();
        }
        else {
            checkbox.uncheck();
        }
    }

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


    return Checkbox;

});