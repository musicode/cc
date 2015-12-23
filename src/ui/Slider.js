/**
 * @file 可滑动组件
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var plus = require('../function/plus');
    var minus = require('../function/minus');
    var divide = require('../function/divide');
    var multiply = require('../function/multiply');

    var toNumber = require('../function/toNumber');
    var restrain = require('../function/restrain');
    var contains = require('../function/contains');
    var eventOffset = require('../function/eventOffset');

    var Draggable = require('../helper/Draggable');

    var lifeUtil = require('../util/life');
    var wheelUtil = require('../util/wheel');
    var touchUtil = require('../util/touch');
    var orientationUtil = require('../util/orientation');

    var document = require('../util/instance').document;

    /**
     * @param {Object} options
     *
     * @property {jQuery} options.mainElement
     *
     * @property {number=} options.value 当前值，不传自动计算 DOM 的位置
     * @property {number} options.minValue value 的最小值，也可以说是开始位置对应的 value
     * @property {number} options.maxValue value 的最大值，也可以说是结束位置对应的 value
     * @property {number=} options.step value 步进值，不传则通过计算确定 step
     * @property {Function} options.slideAnimation 滑动动画
     *
     * @property {(number|Function)=} options.scrollStep 如果需要支持鼠标滚轮，可配置此参数
     * @property {string=} options.scrollStepType 滚轮事件触发的步进类型，可选值是 value、pixel，不传是 pixel
     *
     * @property {string} options.orientation 滑动方向，可选值有 horizontal、vertical
     * @property {boolean=} options.reverse 是否反向滑动，默认是从左到右、从上到下，如果反向，则是从右到左、从下到上
     *
     * @property {string} options.thumbSelector 滑块选择器
     * @property {string=} options.trackSelector 滑道选择器，不传表示 mainElement 是滑道
     * @property {string=} options.barSelector 高亮条选择器
     *
     * @property {string=} options.draggingClass 滑块正在拖拽时给 mainElement 添加的 className
     *
     */
    function Slider(options) {
        lifeUtil.init(this, options);
    }

    var proto = Slider.prototype;

    proto.type = 'Slider';

    proto.init = function () {

        var me = this;

        me.initStruct();

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


        var props = orientationUtil[
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

            return setValue(
                me.pixelToValue(pixel),
                action
            );

        };

        var setValue = function (value, action) {

            var options = {
                action: action
            };

            var oldValue = me.get('value');
            me.set('value', value, options);

            return oldValue !== me.get('value');

        };

        var namespace = me.namespace();

        var drager = new Draggable({
            mainElement: thumbElement,
            containerElement: trackElement,
            containerDraggingClass: me.option('draggingClass'),
            axis: props.axis,
            init: function (options) {
                $.each(touchUtil, function (type, item) {
                    if (!item.support) {
                        return;
                    }
                    thumbElement
                        .on(item.down + namespace, function (e) {
                            if (!options.downHandler(e)) {
                                return;
                            }
                            document
                                .off(namespace)
                                .on(item.move + namespace, options.moveHandler)
                                .on(item.up + namespace, function () {
                                    options.upHandler();
                                    document.off(namespace);
                                });
                        });

                });
            },
            dragAnimation: function (options) {
                setPixel(
                    options.mainStyle[ props.position ],
                    'drag'
                );
            }
        });

        var dispatchEvent = function (e, data) {
            me.emit(e, data);
        };

        drager
            .on('beforedrag', dispatchEvent)
            .on('drag', dispatchEvent)
            .on('afterdrag', dispatchEvent);

        trackElement.on(
            'click' + namespace,
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
        var scrollStepType = me.option('scrollStepType');
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

                var result;

                if (scrollStepType === 'value') {
                    result = setValue(
                        value + offset,
                        action
                    );
                }
                else {
                    result = setPixel(
                        me.valueToPixel(value) + offset,
                        action
                    );
                }

                return !result;

            };

            var addWheel = function (element) {
                wheelUtil.init(element);
                element.on(wheelUtil.WHEEL, wheelHandler);
                wheels.push(element);
            };

            addWheel(trackElement);

            var scrollElement = me.option('scrollElement');
            if (scrollElement) {
                addWheel(scrollElement);
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

        me.set({
            minValue: me.option('minValue'),
            maxValue: me.option('maxValue')
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

        var props = orientationUtil[
            me.option('orientation')
        ];

        var trackElement = me.inner('track');
        var thumbElement = me.inner('thumb');

        var thumbSize = thumbElement[ props.outerSize ](true);
        var maxPixel = trackElement[ props.innerSize ]() - thumbSize;

        var pixelToValue;
        var valueToPixel;

        var minValue = me.get('minValue');
        var maxValue = me.get('maxValue');
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
                    Math.round(
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

        lifeUtil.dispose(me);

        var namespace = me.namespace();
        document.off(namespace);

        me.inner('thumb').off(namespace);
        me.inner('track').off(namespace);
        me.inner('drager').dispose();

        var wheels = me.inner('wheels');
        if (wheels) {
            $.each(wheels, function (index, element) {
                wheelUtil.dispose(element);
            });
        }

    };

    lifeUtil.extend(proto);

    Slider.propertyUpdater = {

        value: function (newValue, oldValue, change) {

            var me = this;

            var props = orientationUtil[
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
                pixel = me.inner('maxPixel') - pixel;
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

            var value = change.value;
            if (value.action) {
                options.action = value.action;
            }

            me.execute(
                'slideAnimation',
                options
            );

        }

    };

    Slider.propertyValidator = {

        value: function (value) {
            var minValue = this.get('minValue');
            var maxValue = this.get('maxValue');
            return restrain(
                toNumber(value, minValue),
                minValue,
                maxValue
            );
        },

        minValue: function (minValue) {
            minValue = toNumber(minValue, null);
            if (minValue == null) {
                this.error('minValue must be a number.');
            }
            return minValue;
        },

        maxValue: function (maxValue) {
            maxValue = toNumber(maxValue, null);
            if (maxValue == null) {
                this.error('maxValue must be a number.');
            }
            return maxValue;
        }

    };


    return Slider;

});
