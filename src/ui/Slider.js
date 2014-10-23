/**
 * @file 可滑动组件
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 75%
     */

    var plus = require('../function/plus');
    var minus = require('../function/minus');
    var divide = require('../function/divide');
    var multiply = require('../function/multiply');

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var restrain = require('../function/restrain');
    var contains = require('../function/contains');
    var position = require('../function/position');
    var eventOffset = require('../function/eventOffset');
    var Draggable = require('../helper/Draggable');
    var Wheel = require('../helper/Wheel');

    /**
     * 可滑动组件，类似 html5 的 <input type="range" />
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {number=} options.value
     *
     * @property {number=} options.min 允许的最小值
     * @property {number=} options.max 允许的最大值
     * @property {number=} options.step value 变化的最小间隔，默认是 10
     *
     * @property {boolean=} options.scrollable 是否可以滚动触发，如果设为 true，需要设置 step
     *
     * @property {string=} options.orientation 方向，可选值有 horizontal 和 vertical，默认是 horizontal
     * @property {string=} options.template 模板，如果 element 结构已完整，可不传模板
     *
     * @property {string=} options.thumbSelector 滑块选择器
     * @property {string=} options.trackSelector 滑道选择器，不传表示 element 是滑道
     *
     * @property {string=} options.draggingClass 滑块正在拖拽时的 class
     *
     * @property {Function=} options.animation 滑动动画
     *
     * @property {Function=} options.onChange 当 value 变化时触发
     */
    function Slider(options) {
        return lifeCycle.init(this, options);
    }

    Slider.prototype = {

        constructor: Slider,

        type: 'Slider',

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;

            if (me.template) {
                element.html(me.template);
            }

            var thumb = element.find(me.thumbSelector);
            var track = me.trackSelector
                      ? element.find(me.trackSelector)
                      : element;

            me.thumb = thumb;
            me.track = track;

            var conf = orientationConf[me.orientation];

            var draggingClass = me.draggingClass;

            me.draggable = new Draggable({
                element: thumb,
                container: track,
                silence: true,
                axis: me.axis,
                onBeforeDrag: function () {

                    if ($.type(draggingClass) === 'string') {
                        track.addClass(draggingClass);
                    }

                },
                onDrag: function (e, data) {

                    var pixel = data[conf.position];

                    me.setValue(
                        pixel2Value(pixel, me.stepPixel, me.minValue, me.stepValue)
                    );
                },
                onAfterDrag: function () {

                    if ($.type(draggingClass) === 'string') {
                        track.removeClass(draggingClass);
                    }

                }
            });

            track.on(
                'click' + namespace,
                function (e) {

                    if (contains(thumb, e.target)) {
                        return;
                    }

                    var pixel = eventOffset(e)[conf.axis];

                    me.setValue(
                        pixel2Value(pixel, me.stepPixel, me.minValue, me.stepValue)
                    );

                }
            );

            if (me.scrollable) {

                var step = me.step;

                me.wheel = new Wheel({
                    element: track,
                    onScroll: function (e, data) {
                        return !me.setValue(
                            me.value + data.delta * step
                        );
                    }
                });

            }

            me.refresh();
        },

        /**
         * 根据当前视图刷新相关计算数值
         *
         * @param {Object=} data
         * @property {number} data.value
         */
        refresh: function (data) {

            var me = this;

            if ($.isPlainObject(data)) {
                $.extend(me, data);
            }

            var conf = orientationConf[me.orientation];

            // min，max 表示值，如 1，10
            // minPixel，maxPixel 表示像素值，如 0，100
            //
            // step 表示步进值
            // stepPixel 表示步进像素值
            //
            // 这里不能覆盖 me.min me.max me.step
            // 不然再次调用 refresh 时，无法进行判断

            var minPixel = 0;
            var maxPixel = me.draggable
                             .getRectange(true)[conf.dimension];

            var stepPixel;

            var min = me.min;
            var max = me.max;
            var step = me.step;

            // 同时满足这三个条件才算步进
            if ($.type(min) === 'number'
                && $.type(max) === 'number'
                && $.type(step) === 'number'
            ) {
                stepPixel = divide(
                                maxPixel,
                                divide(
                                    minus(max, min),
                                    step
                                )
                            );
            }
            else {
                min = minPixel;
                max = maxPixel;
                step = stepPixel = 1;
            }

            me.minPixel = minPixel;
            me.maxPixel = maxPixel;
            me.stepPixel = stepPixel;

            me.minValue = min;
            me.maxValue = max;
            me.stepValue = step;

            var value = me.value;

            if ($.type(value) !== 'number') {
                value = position(me.thumb)[conf.position];
            }

            // 确保不同，才可正常更新
            me.value = !value;

            me.setValue(value);

        },

        /**
         * 获取当前值
         *
         * @return {number}
         */
        getValue: function () {
            return this.value;
        },

        /**
         * 设置当前值
         *
         * @param {number} value
         * @param {boolean=} silence 是否不触发 change 事件
         * @return {boolean} 是否更新成功
         */
        setValue: function (value, silence) {

            var me = this;

            var min = me.minValue;
            var max = me.maxValue;
            var step = me.stepValue;

            value = restrain(value, min, max);

            var result = value !== me.value;

            if (result) {

                me.value = value;

                var style = { };
                var conf = orientationConf[me.orientation];

                style[conf.position] = multiply(
                                            me.stepPixel,
                                            divide(
                                                minus(value, min),
                                                step
                                            )
                                        );

                var thumb = me.thumb;

                if ($.isFunction(me.animation)) {
                    me.animation(style, thumb);
                }
                else {
                    thumb.css(style);
                }

                if (!silence) {
                    me.emit('change');
                }
            }

            return result;

        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.track.off(namespace);
            me.draggable.dispose();

            if (me.wheel) {
                me.wheel.dispose();
            }

            me.element =
            me.draggable =
            me.wheel = null;
        }

    };

    jquerify(Slider.prototype);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Slider.defaultOptions = {
        step: 10,
        scrollable: true,
        orientation: 'horizontal'
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_slider';

    /**
     * 配置方向属性
     *
     * @inner
     * @type {Object}
     */
    var orientationConf = {
        horizontal: {
            axis: 'x',
            position: 'left',
            dimension: 'width'
        },
        vertical: {
            axis: 'y',
            position: 'top',
            dimension: 'height'
        }
    };

    /**
     * 像素值转为 value
     *
     * @inner
     * @param {number} pixel
     * @param {number} stepPixel
     * @param {number} minValue
     * @param {number} stepValue
     * @returns {number}
     */
    function pixel2Value(pixel, stepPixel, minValue, stepValue) {
        return plus(
                minValue,
                multiply(
                    Math.floor(
                        divide(pixel, stepPixel)
                    ),
                    stepValue
                )
            );
    }

    return Slider;

});
