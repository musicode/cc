/**
 * @file 模拟 <input type="number" />
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var timer = require('cobble/function/timer');
    var lifeCycle = require('cobble/function/lifeCycle');

    var plus = require('cobble/function/plus');
    var minus = require('cobble/function/minus');
    var divide = require('cobble/function/divide');

    var Input = require('cobble/helper/Input');
    var instance = require('cobble/util/instance');

    /**
     * 构造函数
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element <input type="number" /> 元素
     * @property {number} options.defaultValue 默认值
     * @property {?string} options.template 模拟 <input type="number" /> 的模版，一般有一个输入框，一个向上的按钮，一个向下的按钮
     * @property {?string} options.upSelector 向上按钮的选择器
     * @property {?string} options.downSelector 向下按钮的选择器
     * @property {?Function} options.onChange 数值变化时调用的接口
     */
    function Number(options) {
        return lifeCycle.init(this, options);
    }

    Number.prototype = {

        constructor: Number,

        type: 'Number',

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;
            var faker = me.faker = $(me.template);
            element.replaceWith(faker);

            faker.find(':text').replaceWith(element);

            me.step = + element.attr('step') || 1;
            me.min = element.attr('min');
            me.max = element.attr('max');

            var upHandler = function () {

                var value = plus(me.getValue(), me.step);

                if (me.max != null) {
                    value = Math.min(me.max, value);
                }

                me.setValue(value);

            };
            var downHandler = function () {

                var value = minus(me.getValue(), me.step);

                if (me.min != null) {
                    value = Math.max(me.min, value);
                }

                me.setValue(value);

            };

            me.input = new Input({
                element: element,
                scope: me,
                longPress: true,
                action: {
                    up: upHandler,
                    down: downHandler
                }
            });


            var upTimer = timer(upHandler, 40, 400);
            var downTimer = timer(downHandler, 40, 400);

            var mouseup = 'mouseup' + namespace;
            var mousedown = 'mousedown' + namespace;
            var blur = 'focusout' + namespace;

            faker
            .on(mouseup, me.upSelector, upTimer.start)
            .on(mousedown, me.downSelector, downTimer.start)
            .on(blur, ':text', function () {
                me.setValue(element.val());
            });

            instance.document.on(
                mouseup,
                function () {
                    upTimer.stop();
                    downTimer.stop();
                }
            );
        },

        /**
         * 取值
         *
         * @return {number}
         */
        getValue: function () {

            var me = this;

            return me.element.val() || me.defaultValue;

        },

        /**
         * 设值
         *
         * @param {string|number} value
         */
        setValue: function (value) {

            var me = this;

            if (!me.validate(value)) {
                value = me.defaultValue;
            }

            me.element.val(value);

            if ($.isFunction(me.onChange)) {
                me.onChange();
            }
        },

        /**
         * 验证
         *
         * @param {?string} value
         */
        validate: function (value) {

            var me = this;
            var element = me.element;

            if (value == null) {
                value = $.trim(element.val());
            }

            if ($.type(value) === 'string') {
                value = + value;
            }

            if (isNaN(value) || (value < me.min || value > me.max)) {
                return false;
            }

            var result = divide(minus(value, me.min), me.step);
            return result === Math.floor(result);
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.faker.off(namespace);
            instance.document.off(namespace);
            me.input.dispose();

            me.element =
            me.faker =
            me.input = null;
        }

    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Number.defaultOptions = {
        defaultValue: 0,
        upSelector: '.increase',
        downSelector: '.decrease',
        template: '<div class="form-number">'
                +     '<input class="form-text" type="text" />'
                +     '<i class="increase"></i>'
                +     '<i class="decrease"></i>'
                + '</div>'
    };


    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery} element
     * @param {Object=} options
     * @return {Array.<Number>}
     */
    Number.init = function (element, options) {

        var result = [ ];

        element.each(
            function () {
                result.push(
                    new Number(
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
    var namespace = '.cobble_form_number';


    return Number;

});