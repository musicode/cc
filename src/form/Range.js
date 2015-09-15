/**
 * @file 模拟 <input type="range" />
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var Slider = require('../ui/Slider');
    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var init = require('../function/init');

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

    var proto = Range.prototype;

    proto.type = 'Range';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;
        var element = me.element;

        me.value = + element.val();

        var mainElement =
        me.main = $(me.template);

        element.hide().before(mainElement);

        var min = element.attr('min');
        var max = element.attr('max');
        var step = element.attr('step');

        me.slider = new Slider({
            element: mainElement,
            min: min != null ? + min : min,
            max: max != null ? + max : max,
            step: step != null ? + step : 1,
            scrollable: false,
            orientation: 'horizontal',
            thumbSelector: me.thumbSelector,
            trackSelector: me.trackSelector,
            onChange: function () {

                var value = + this.value;

                me.setValue(
                    value,
                    {
                        from: FROM_SLIDER
                    }
                );

            }
        });

    };

    /**
     * 取值
     *
     * @return {number}
     */
    proto.getValue = function () {
        return this.value || 0;
    };

    /**
     * 设值
     *
     * @param {number} value
     * @param {Object=} options 选项
     * @property {boolean=} options.force 是否强制执行，不判断是否跟旧值相同
     * @property {boolean=} options.silence 是否不触发 change 事件
     */
    proto.setValue = function (value, options) {

        var me = this;

        if (setValue(me, 'value', value, options)) {

            me.element.val(value);

            if (!options || options.from !== FROM_SLIDER) {
                me.slider.setValue(value);
            }

        }

    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.slider.dispose();

        me.main =
        me.slider =
        me.element = null;

    };

    jquerify(proto);

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
    Range.init = init(Range);


    var FROM_SLIDER = 'slider';


    return Range;

});