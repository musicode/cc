/**
 * @file ScrollBar
 * @author musicode
 */
define(function (require, exports, module) {

    /**
     *
     * 通过隐藏原生滚动条，控制元素的 scrollTop/scrollLeft 实现滚动
     *
     * 核心逻辑分两块
     *
     * 1. 计算 视窗高度 / 内容高度，用这个比值渲染滚动滑块
     * 2. 计算 内容大小 / 滚动条大小，算出滑块每滚动 1px，内容元素滚动多少
     *
     * 注意：
     *
     * 1. 宽高必须用整形，否则涉及到浮点运算，很容易出现精度问题
     *    在滚动距离非常大时，这个问题会非常明显
     *
     */

    'use strict';

    var divide = require('../function/divide');
    var multiply = require('../function/multiply');
    var restrain = require('../function/restrain');
    var jquerify = require('../function/jquerify');
    var contains = require('../function/contains');
    var eventOffset = require('../function/eventOffset');
    var lifeCycle = require('../function/lifeCycle');
    var Wheel = require('../helper/Wheel');
    var Draggable = require('../helper/Draggable');

    /**
     * 自定义滚动条
     *
     * @constructor
     * @property {Object} options
     *
     * @property {jQuery} options.element 滚动条元素
     * @property {string=} options.template 滚动条的模板，如果 element 结构完整，可不传模板
     *
     * @property {jQuery} options.panel 滚动面板
     *
     * @property {number=} options.value 面板当前滚动的位置，不传则计算元素当前位置
     *
     * @property {string=} options.orientation 滚动方向，可选值有 horizontal 和 vertical，默认是 vertical
     * @property {number=} options.scrollStep 滚动的单位像素，默认是 20
     * @property {number=} options.minWidth 滚动条的最小宽度，当 orientation  为 horizontal 时生效
     * @property {number=} options.minHeight 滚动条的最小高度，当 orientation  为 vertical 时生效
     *
     * @property {string=} options.thumbSelector 从 template 选中滑块的选择器
     *
     * @property {string=} options.draggingClass 拖拽滑块时的 class
     *
     * @property {Function=} options.showAnimation
     * @property {Function=} options.hideAnimation
     *
     * @property {Function=} options.onScroll
     * @argument {Event} options.onScroll.event
     * @argument {Object} options.onScroll.data
     */
    function ScrollBar(options) {
        return lifeCycle.init(this, options);
    }

    ScrollBar.prototype = {

        constructor: ScrollBar,

        type: 'ScrollBar',

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;

            var scrollHandler = function (e, data) {

                var offsetPixel = data.delta * me.scrollStep;
                var offsetValue = me.panelPixelToValue(offsetPixel);

                return !me.to(
                    me.value + offsetValue,
                    {
                        from: 'wheel'
                    }
                );

            };

            me.panelWheel = new Wheel({
                element: me.panel,
                onScroll: scrollHandler
            });

            me.barWheel = new Wheel({
                element: element,
                onScroll: scrollHandler
            });


            var thumbSelector = me.thumbSelector;
            var thumbElement = element.find(thumbSelector);
            if (thumbElement.length === 0) {
                element.html(me.template);
                thumbElement = element.find(thumbSelector);
            }

            me.thumb = thumbElement;


            var axisName;
            var positionName;

            if (me.orientation === 'vertical') {
                axisName = 'y';
                positionName = 'top';
            }
            else {
                axisName = 'x';
                positionName = 'left';
            }

            var to = function (pixel, from) {
                me.to(
                    me.barPixelToValue(pixel),
                    {
                        from: from
                    }
                );
            };

            var draggingClass = me.draggingClass;

            me.draggable = new Draggable({
                element: thumbElement,
                container: element,
                axis: axisName,
                onBeforeDrag: function () {
                    if ($.type(draggingClass) === 'string') {
                        element.addClass(draggingClass);
                    }
                },
                onDrag: function (e, data) {
                    to(data[ positionName ], 'bar');
                },
                onAfterDrag: function () {
                    if ($.type(draggingClass) === 'string') {
                        element.removeClass(draggingClass);
                    }
                }
            });

            element.on(
                'click' + namespace,
                function (e) {
                    if (contains(thumbElement, e.target)) {
                        return;
                    }
                    to(eventOffset(e)[ axisName ], 'click');
                }
            );

            me.refresh(
                {
                    value: me.value
                },
                true
            );

        },

        /**
         * 刷新滚动条
         *
         * 如果没有传入 value，则根据 DOM 位置自动算出 value
         *
         * @param {Object=} data
         * @property {number} data.value
         */
        refresh: function (data) {

            //
            // [建议]
            //
            // 某些浏览器（测试时是火狐）
            // 在 js 执行期间获取到的 scrollHeight
            // 和 js 执行完之后获取的 scrollHeight 不一样
            // 因此调用时最好设置一个延时，确保刷新时是最新的 DOM 树
            //

            var me = this;

            var silence;

            if ($.isPlainObject(data)) {
                $.extend(me, data);
            }

            if (data === true || arguments[1] === true) {
                silence = true;
            }

            var innerSizeName;
            var outerSizeName;
            var scrollSizeName;
            var minSizeName;
            var positionName;
            var scrollName;

            if (me.orientation === 'vertical') {
                innerSizeName = 'innerHeight';
                outerSizeName = 'outerHeight';
                scrollSizeName = 'scrollHeight';
                minSizeName = 'minHeight';
                positionName = 'top';
                scrollName = 'scrollTop';
            }
            else {
                innerSizeName = 'innerWidth';
                outerSizeName = 'outerWidth';
                scrollSizeName = 'scrollWidth';
                minSizeName = 'minWidth';
                positionName = 'left';
                scrollName = 'scrollLeft';
            }

            var panelElement = me.panel;

            var viewportSize = panelElement[ innerSizeName ]();
            var contentSize = panelElement.prop(scrollSizeName);

            var ratio = contentSize > 0
                      ? viewportSize / contentSize
                      : 1;

            if (ratio > 0 && ratio < 1) {

                me.showAnimation();

                var trackElement = me.element;
                var thumbElement = me.thumb;

                var trackSize = trackElement[ innerSizeName ]();
                var thumbSize = multiply(ratio, trackSize);

                var minThumbSize = me[ minSizeName ];
                if (thumbSize < minThumbSize) {
                    thumbSize = minThumbSize;
                }

                // 转成整数，为了避免结果是 0，这里使用向上取整
                thumbSize = Math.ceil(thumbSize);

                thumbElement[ outerSizeName ](thumbSize);

                var panelMaxPixel = contentSize - viewportSize;
                var barMaxPixel = trackSize - thumbSize;
// console.log('====================')
// console.log('panel: ', contentSize, viewportSize, panelMaxPixel);
// console.log('bar: ', trackSize, thumbSize, barMaxPixel);
                me.panelPixelToValue = function (pixel) {
                    return multiply(
                            maxValue,
                            divide(pixel, panelMaxPixel)
                        );
                };

                me.valueToPanelPixel = function (value) {
                    return multiply(
                            panelMaxPixel,
                            divide(value, maxValue)
                        );
                };

                me.barPixelToValue = function (pixel) {
                    return multiply(
                            maxValue,
                            divide(pixel, barMaxPixel)
                        );
                };

                me.valueToBarPixel = function (value) {
                    return multiply(
                            barMaxPixel,
                            divide(value, maxValue)
                        );
                };

                me.syncBar = function (value) {
                    var pixel = me.valueToBarPixel(value);
                    thumbElement.css(positionName, pixel);
                };

                me.syncPanel = function (value) {
                    var pixel = me.valueToPanelPixel(value);
                    panelElement[scrollName](pixel);
                };

                var from;
                var value = data && data.value;

                if (value >= minValue && value <= maxValue) { }
                else {
                    from = 'panel';
                    value = me.panelPixelToValue(
                        panelElement[ scrollName ]()
                    );
                }

                me.to(
                    value,
                    {
                        force: true,
                        silence: silence,
                        from: from
                    }
                );

            }
            else {
                me.hideAnimation();

                me.panelPixelToValue =
                me.valueToPanelPixel =
                me.barPixelToValue =
                me.valueToBarPixel =
                me.syncPanel =
                me.syncBar = $.noop;
            }

        },

        /**
         * 设置滚动条的位置
         *
         * @param {number} value 0 到 100，0 表示起点， 100 表示终点
         * @param {Object=} options 选项
         * @property {boolean=} options.force 是否强制执行，不判断是否跟旧值相同
         * @property {boolean=} options.silence 是否不触发 change 事件
         * @return {boolean} 是否滚动成功
         */
        to: function (value, options) {

            var me = this;

            options = options || { };

            value = restrain(value, minValue, maxValue);

            if (options.force || value != me.value) {

                me.value = value;

                var from = options.from;

                if (from !== 'panel') {
                    me.syncPanel(value);
                }

                if (from !== 'bar') {
                    me.syncBar(value);
                }

                if (!options.silence) {
                    me.emit('scroll');
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

            me.element.off(namespace);
            me.panelWheel.dispose();
            me.barWheel.dispose();
            me.draggable.dispose();

            me.element =
            me.panelWheel =
            me.barWheel =
            me.draggable =
            me.thumb = null;

        }

    };

    jquerify(ScrollBar.prototype);

    var minValue = 0;

    var maxValue = 100;

    var namespace = '.cobble_ui_scrollbar';

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    ScrollBar.defaultOptions = {
        scrollStep: 20,
        orientation: 'vertical',
        minWidth: 10,
        minHeight: 10,
        template: '<i class="scroll-thumb"></i>',
        thumbSelector: '.scroll-thumb',
        showAnimation: function () {
            this.element.show();
        },
        hideAnimation: function () {
            this.element.hide();
        }
    };


    return ScrollBar;

});
