/**
 * @file 可滑动组件
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 75%
     *
     * slider 有两种常见用法：
     *
     * 1. 进度条、音量条为代表的以 1px 为最小变化量
     * 2. 单位步进，比如每滑动一次移动 10px
     *
     * 鼠标滚轮通常来说，可以理解为滚一下移动多少像素，比如 10px。
     * 但是当可滚动距离非常大时，10px 的偏移甚至感觉不到有滚动
     * 因此更好的方式不是基于像素，而是基于 value
     * 以垂直滚动条为例，假设顶部值为 0，底部值为 100，于是整个可滚动距离被平分为 100 份
     * 我们把滚动一次的偏移值设为 1，就表示每滚动一次，移动 1%，滚动 100 次就到头了
     *
     *
     * 综上，组件需求如下：
     *
     * 1. 配置 min 和 max，表示 value 的计算基于百分比（如音量条可配置为 0 100）
     *
     * 2. 配置 min max step，表示按 step 步进，即下一个值是 value + step
     *
     * 3. 配置 scrollStep，表示支持鼠标滚轮，值取决与 min 和 max
     *
     * 4. 配置 orientation 支持水平和垂直两个方向的滑动，默认方向是从左到右，从上到下，
     *    但有小部分需求是反向的，因此支持反向配置
     */

    var plus = require('../function/plus');
    var minus = require('../function/minus');
    var divide = require('../function/divide');
    var multiply = require('../function/multiply');

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var restrain = require('../function/restrain');
    var contains = require('../function/contains');
    var getPosition = require('../function/position');
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
     * @property {number=} options.min 允许的最小值，默认是 0
     * @property {number=} options.max 允许的最大值，默认是 100
     * @property {number=} options.step 步进值，默认是 1
     *
     * @property {boolean=} options.scrollStep 如果需要支持鼠标滚轮，可配置此参数，表示单位步进值
     * @property {boolean=} options.reverse 是否反向，默认是从左到右，或从上到下，如果反向，则是从右到左，从下到上
     *
     * @property {string=} options.orientation 方向，可选值有 horizontal 和 vertical，默认是 horizontal
     * @property {string=} options.template 模板，如果 element 结构已完整，可不传模板
     *
     * @property {string=} options.thumbSelector 滑块选择器
     * @property {string=} options.trackSelector 滑道选择器，不传表示 element 是滑道
     * @property {string=} options.barSelector 高亮条选择器
     *
     * @property {string=} options.draggingClass 滑块正在拖拽时的 class
     *
     * @property {Function=} options.onBeforeDrag
     * @property {Function=} options.onAfterDrag
     *
     * @property {Function=} options.onChange 当 value 变化时触发
     *
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

            var thumbSelector = me.thumbSelector;
            var thumb;

            if ($.type(thumbSelector) === 'string') {

                thumb = element.find(thumbSelector);

                if (!thumb.length && me.template) {
                    element.html(me.template);
                    thumb = element.find(thumbSelector);
                }

            }

            var trackSelector = me.trackSelector;
            var track = $.type(trackSelector) === 'string'
                      ? element.find(trackSelector)
                      : element;

            var barSelector = me.barSelector;
            if ($.type(barSelector) === 'string') {
                me.bar = element.find(barSelector);
            }

            me.track = track;
            me.thumb = thumb;

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
                    me.emit('beforeDrag');
                },
                onDrag: function (e, data) {
                    me.setValue(
                        me.positionToValue(data),
                        {
                            from: 'drag'
                        }
                    );
                },
                onAfterDrag: function () {
                    if ($.type(draggingClass) === 'string') {
                        track.removeClass(draggingClass);
                    }
                    me.emit('afterDrag');
                }
            });

            track.on(
                'click' + namespace,
                function (e) {

                    if (contains(thumb, e.target)) {
                        return;
                    }

                    var value = me.positionToValue(
                        eventOffset(e)
                    );

                    me.setValue(
                        value,
                        {
                            from: 'click'
                        }
                    );

                }
            );

            if (me.scrollStep > 0) {

                var scrollStep = me.scrollStep;

                me.wheel = new Wheel({
                    element: track,
                    onScroll: function (e, data) {

                        var offset = data.delta * scrollStep;

                        if (me.reverse) {
                            offset *= -1;
                        }

                        var value = me.value + offset;

                        return !me.setValue(
                            value,
                            {
                                from: 'wheel'
                            }
                        );

                    }
                });

            }

            me.refresh(true);

        },

        /**
         * 根据当前视图刷新相关计算数值
         *
         * @param {Object=} data
         * @property {number} data.value
         */
        refresh: function (data) {

            var me = this;

            // 初始化时不需要触发 change 事件
            var silence;

            if ($.isPlainObject(data)) {
                $.extend(me, data);
            }

            if (data === true || arguments[1] === true) {
                silence = true;
            }

            /**
             *
             * 此处的核心逻辑是怎么把 value 转换为 pixel
             *
             * min 和 max 是必定有值的
             *
             * 当传了 step 时，可以计算出总步数，以及每步的像素长度
             *
             *     pixel = (value - min) * stepPixel
             *     value = min + pixel / stepPixel
             *
             * 当未传 step 时
             *
             *     value = min + (max - min) * pixel / maxPixel
             *     pixel = (value - min) * maxPixel / (max - min)
             */

            var draggableRect = me.draggable.getRectange(true);
            var thumb = me.thumb;

            var axis;
            var position;
            var maxPixel;
            var thumbSize;

            var isVertical = me.orientation === 'vertical';

            if (isVertical) {
                axis = 'y';
                position = 'top';
                maxPixel = draggableRect.height;
                thumbSize = thumb.outerHeight();
            }
            else {
                axis = 'x';
                position = 'left';
                maxPixel = draggableRect.width;
                thumbSize = thumb.outerWidth();
            }

            var thumbHalfSize = thumbSize / 2;

            var min = me.min;
            var max = me.max;
            var step = me.step;

            var pixelToValue;
            var valueToPixel;

            if ($.type(step) === 'number') {

                var stepPixel = divide(
                                    maxPixel,
                                    divide(
                                        minus(max, min),
                                        step
                                    )
                                );

                pixelToValue = function (pixel) {
                    return plus(
                        min,
                        Math.floor(
                            divide(
                                pixel,
                                stepPixel
                            )
                        )
                    );
                };
                valueToPixel = function (value) {
                    return multiply(
                        minus(value, min),
                        stepPixel
                    );
                };

            }
            else {

                pixelToValue = function (pixel) {
                    return plus(
                        min,
                        multiply(
                            minus(max, min),
                            divide(pixel, maxPixel)
                        )
                    );
                };
                valueToPixel = function (value) {
                    return multiply(
                        minus(value, min),
                        divide(
                            maxPixel,
                            minus(max, min)
                        )
                    );
                };

            }

            var reverse = me.reverse;

            me.pixelToValue = function (pixel) {

                pixel = restrain(pixel, 0, maxPixel);

                if (reverse) {
                    pixel = maxPixel - pixel;
                }

                return pixelToValue(pixel);

            };

            me.valueToPixel = function (value) {

                value = restrain(value, min, max);

                var pixel = valueToPixel(value);

                if (reverse) {
                    pixel = maxPixel - pixel;
                }

                return pixel;

            };

            me.positionToValue = function (data) {

                var pixel = data[position];

                if (pixel == null) {
                    pixel = data[axis];
                }

                return me.pixelToValue(pixel);

            };

            me.syncBar = function (pixel) {

                var bar = me.bar;

                if (bar) {
                    if (reverse) {
                        pixel = maxPixel - pixel;
                    }

                    if (isVertical) {
                        bar.height(pixel);
                    }
                    else {
                        bar.width(pixel);
                    }
                }
            };

            var value = me.value;

            if ($.type(value) !== 'number') {
                value = me.positionToValue(
                    getPosition(thumb)
                );
            }

            me.setValue(
                value,
                {
                    force: true,
                    silence: silence
                }
            );

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
         * @param {Object=} options 选项
         * @property {boolean=} options.force 是否强制执行，不判断是否跟旧值相同
         * @property {boolean=} options.silence 是否不触发 change 事件
         * @return {boolean} 是否更新成功
         */
        setValue: function (value, options) {

            var me = this;

            var min = me.min;
            var max = me.max;

            value = restrain(value, min, max);

            options = options || { };

            if (options.force || value !== me.value) {

                me.value = value;

                var isVertical = me.orientation === 'vertical';

                var name = isVertical ? 'top' : 'left';
                var pixel = me.valueToPixel(value);

                me.thumb.css(name, pixel);

                me.syncBar(pixel);

                if (!options.silence) {
                    me.emit('change');
                }

                return true;

            }

            return false;

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
                me.wheel = null;
            }

            me.element =
            me.draggable = null;

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
        min: 0,
        max: 100,
        orientation: 'horizontal',
        template: '<div class="slider-thumb"></div>'
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_slider';


    return Slider;

});
