/**
 * @file 可滑动组件
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
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
     * 1. 配置 minValue 和 maxValue，表示 value 的计算基于百分比（如音量条可配置为 0 100）
     *
     * 2. 配置 minValue maxValue step，表示按 step 步进，即下一个值是 value + step
     *
     * 3. 配置 scrollStep，表示支持鼠标滚轮，值取决与 minValue 和 maxValue
     *
     * 4. 配置 orientation 支持水平和垂直两个方向的滑动，默认方向是从左到右，从上到下，
     *    但有小部分需求是反向的，因此支持反向配置
     */

    var plus = require('../function/plus');
    var minus = require('../function/minus');
    var divide = require('../function/divide');
    var multiply = require('../function/multiply');

    var toNumber = require('../function/toNumber');
    var restrain = require('../function/restrain');
    var contains = require('../function/contains');
    var eventOffset = require('../function/eventOffset');

    var Draggable = require('../helper/Draggable');
    var Wheel = require('../helper/Wheel');

    var lifeCycle = require('../util/lifeCycle');
    var orientationMap = require('../util/orientation');

    /**
     * 可滑动组件，类似 html5 的 <input type="range" />
     *
     * @param {Object} options
     *
     * @property {jQuery} options.mainElement
     * @property {string=} options.mainTemplate 模板，如果 mainElement 结构已完整，可不传模板
     *
     * @property {number=} options.value
     *
     * @property {number=} options.minValue 允许的最小值，默认是 0
     * @property {number=} options.maxValue 允许的最大值，默认是 100
     * @property {number=} options.step 步进值，默认是 1
     * @property {Function=} options.slideAnimate 滑动动画
     *
     * @property {boolean=} options.scrollStep 如果需要支持鼠标滚轮，可配置此参数，表示单位步进值
     * @property {boolean=} options.scrollStepType 滚动步进类型，可选值是 value 或 pixel，默认是 value
     * @property {boolean=} options.reverse 是否反向，默认是从左到右，或从上到下，如果反向，则是从右到左，从下到上
     *
     * @property {string=} options.orientation 方向，可选值有 horizontal 和 vertical，默认是 horizontal
     *
     * @property {string=} options.thumbSelector 滑块选择器
     * @property {string=} options.trackSelector 滑道选择器，不传表示 mainElement 是滑道
     * @property {string=} options.barSelector 高亮条选择器
     *
     * @property {string=} options.draggingClass 滑块正在拖拽时的 className
     *
     */
    function Slider(options) {
        lifeCycle.init(this, options);
    }

    var proto = Slider.prototype;

    proto.type = 'Slider';

    proto.init = function () {

        var me = this;

        me.initStructure();

        var mainElement = me.option('mainElement');
        var thumbElement = mainElement.find(
            me.option('thumbSelector')
        );

        var trackSelector = me.option('trackSelector');
        var trackElement = trackSelector
                         ? mainElement.find(trackSelector)
                         : mainElement;

        var barSelector = me.option('barSelector');
        var barElement;
        if (barSelector) {
            barElement = mainElement.find(barSelector);
        }


        var props = orientationMap[
            me.option('orientation')
        ];

        var reverse = me.option('reverse');

        var setPixel = function (pixel, action) {

            if ($.type(pixel) !== 'number') {
                pixel = toNumber(pixel, 0, 'float');
            }

            if (reverse) {
                pixel = me.inner('maxPixel') - pixel;
            }

            setValue(
                me.pixelToValue(pixel),
                action
            );

        };

        var setValue = function (value, action) {

            me.set(
                'value',
                value,
                {
                    action: action
                }
            );

        };

        var drager = new Draggable({
            mainElement: thumbElement,
            containerElement: trackElement,
            containerDraggingClass: me.option('draggingClass'),
            axis: me.option('axis'),
            context: me,
            dragAnimate: function (options) {
                setPixel(
                    options.mainStyle[ props.position ],
                    'drag'
                );
            }
        });

        trackElement.on(
            'click' + me.namespace(),
            function (e) {

                if (contains(thumbElement, e.target)) {
                    return;
                }

                setPixel(
                    eventOffset(e)[ props.axis ] - me.inner('thumbSize') / 2,
                    'click'
                );

            }
        );

        var scrollStep = me.option('scrollStep');
        var scrollStepIsFunction = $.isFunction(scrollStep);

        var wheels;

        if (scrollStepIsFunction || scrollStep > 0) {

            wheels = [ ];

            var wheelHandler = function (e, data) {

                var delta = data.delta;

                var offset = scrollStepIsFunction
                           ? scrollStep(delta)
                           : delta * scrollStep;

                if (!offset) {
                    return;
                }

                if (reverse) {
                    offset *= -1;
                }

                var action = 'scroll';
                var value = me.get('value');

                if (me.option('scrollStepType') === 'value') {
                    setValue(
                        value + offset,
                        action
                    );
                }
                else {
                    setPixel(
                        me.valueToPixel(value) + offset,
                        action
                    );
                }

                return false;

            };

            wheels.push(
                new Wheel({
                    watchElement: trackElement,
                    onwheel: wheelHandler
                })
            );

            var scrollElement = me.option('scrollElement');
            if (scrollElement) {
                wheels.push(
                    new Wheel({
                        watchElement: scrollElement,
                        onwheel: wheelHandler
                    })
                );
            }

        }

        me.inner({
            main: mainElement,
            track: trackElement,
            thumb: thumbElement,
            bar: barElement,
            drager: drager,
            wheels: wheels
        });



        me.refresh();

        var value = me.option('value');

        if ($.type(value) === 'number') {
            setValue(value);
        }
        else {
            setPixel(
                thumbElement.css(props.position)
            );
        }

    };

    /**
     * 根据当前视图刷新相关计算数值
     */
    proto.refresh = function () {

        var me = this;

        /**
         *
         * 此处的核心逻辑是 value <=> pixel
         *
         * minValue 和 maxValue 是必定有值的
         *
         * 当传了 step 时，可以计算出总步数，以及每步的像素长度
         *
         *     pixel = (value - minValue) * stepPixel
         *     value = minValue + pixel / stepPixel
         *
         * 当未传 step 时
         *
         *     value = minValue + (maxValue - minValue) * pixel / maxPixel
         *     pixel = (value - minValue) * maxPixel / (maxValue - minValue)
         *
         */

        var props = orientationMap[
            me.option('orientation')
        ];

        var trackElement = me.inner('track');
        var thumbElement = me.inner('thumb');

        var thumbSize = thumbElement[ props.outerSize ](true);
        var maxPixel = trackElement[ props.innerSize ]() - thumbSize;

        var pixelToValue;
        var valueToPixel;

        var minValue = me.option('minValue');
        var maxValue = me.option('maxValue');
        var step = me.option('step');

        if ($.type(step) === 'number') {

            var stepPixel = divide(
                                maxPixel,
                                divide(
                                    minus(maxValue, minValue),
                                    step
                                )
                            );

            pixelToValue = function (pixel) {
                return plus(
                    minValue,
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
                    minus(value, minValue),
                    stepPixel
                );
            };

        }
        else {

            pixelToValue = function (pixel) {
                return plus(
                    minValue,
                    multiply(
                        minus(maxValue, minValue),
                        divide(pixel, maxPixel)
                    )
                );
            };
            valueToPixel = function (value) {
                return multiply(
                    minus(value, minValue),
                    divide(
                        maxPixel,
                        minus(maxValue, minValue)
                    )
                );
            };

        }

        me.inner({
            thumbSize: thumbSize,
            maxPixel: maxPixel
        });

        me.pixelToValue = pixelToValue;
        me.valueToPixel = valueToPixel;

        var value = me.get('value');

        if ($.type(value) === 'number') {
            me.set('value', value, {
                force: true
            });
        }

    };

    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('track').off(
            me.namespace()
        );
        me.inner('drager').dispose();

        var wheels = me.inner('wheels');
        if (wheels) {
            $.each(wheels, function (index, wheel) {
                wheel.dispose();
            });
        }

    };

    lifeCycle.extend(proto);

    Slider.defaultOptions = {
        minValue: 0,
        maxValue: 100,
        scrollStepType: 'value',
        orientation: 'horizontal',
        mainTemplate: '<div class="slider-thumb"></div>',
        slideAnimate: function (options) {
            options.thumbElement.css(options.thumbStyle);
            if (options.barStyle) {
                options.barElement.css(options.barStyle);
            }
        }
    };

    Slider.propertyUpdater = {

        value: function (newValue, oldValue, changes) {

            var me = this;

            var props = orientationMap[
                me.option('orientation')
            ];

            var thumbElement = me.inner('thumb');
            var thumbSize = me.inner('thumbSize');

            var pixel = me.valueToPixel(newValue);

            var barStyle;

            var barElement = me.inner('bar');
            if (barElement) {
                barStyle = { };
                barStyle[ props.size ] = pixel + thumbSize / 2;
            }

            if (me.option('reverse')) {
                pixel = me.inner('maxPixel') - pixel - thumbSize;
            }

            var thumbStyle = { };
            thumbStyle[ props.position ] = pixel;




            var options = {
                thumbElement: thumbElement,
                thumbStyle: thumbStyle
            };

            if (barStyle) {
                options.barStyle = barStyle;
                options.barElement = barElement;
            }

            var change = changes.value;
            if (change.action) {
                options.action = change.action;
            }

            me.execute(
                'slideAnimate',
                options
            );

        }

    };

    Slider.propertyValidator = {

        value: function (value) {

            var me = this;
            var minValue = me.option('minValue');
            var maxValue = me.option('maxValue');

            value = toNumber(value, minValue);

            return restrain(value, minValue, maxValue);

        }

    };


    return Slider;

});
