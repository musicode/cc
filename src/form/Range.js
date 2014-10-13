/**
 * @file 模拟 <input type="range" />
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var Slider = require('cobble/ui/Slider');
    var lifeCycle = require('cobble/function/lifeCycle');

    /**
     * range 构造函数
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element <input type="range" /> 元素
     * @property {string} options.template 模版
     * @property {string} options.thumbSelector 滑块选择器
     * @property {string=} options.trackSelector 滑道选择器，不传默认是 $(template) 元素
     * @property {Function} options.onChange 值变化事件
     */
    function Range(options) {
        return lifeCycle.init(this, options);
    }

    Range.prototype = {

        constructor: Range,

        type: 'Range',

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;
            me.value = + element.val();

            var faker = me.faker = $(me.template);

            element.hide().before(faker);

            var min = element.attr('min');
            var max = element.attr('max');
            var step = element.attr('step');

            me.slider = new Slider({
                element: faker,
                min: min != null ? + min : min,
                max: max != null ? + max : max,
                step: step != null ? + step : 1,
                scrollable: false,
                orientation: 'horizontal',
                thumbSelector: me.thumbSelector,
                trackSelector: me.trackSelector,
                onChange: function () {
                    me.setValue(+ this.value);
                }
            });

        },

        /**
         * 取值
         *
         * @return {number}
         */
        getValue: function () {
            return this.value || 0;
        },

        /**
         * 设值
         *
         * @param {number} value
         */
        setValue: function (value) {

            var me = this;

            if (value !== me.value) {

                me.value = value;
                me.element.val(value);

                if (me.slider) {
                    me.slider.setValue(value);
                }

                if ($.isFunction(me.onChange)) {
                    me.onChange();
                }
            }
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.slider.dispose();

            me.faker =
            me.slider =
            me.element = null;
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Range.defaultOptions = {

    };

    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery} element
     * @param {Object=} options
     * @return {Array.<Range>}
     */
    Range.init = function (element, options) {

        var result = [ ];

        element.each(
            function () {
                result.push(
                    new Range(
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



    return Range;

});