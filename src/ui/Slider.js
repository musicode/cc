/**
 * @file Slider
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var Draggable = require('../helper/Draggable');
    var Wheel = require('../helper/Wheel');

    /**
     * 可滑动组件，类似 html5 的 <input type="number" />
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {number=} options.value
     * @property {number=} options.min 允许的最小值
     * @property {number=} options.max 允许的最大值
     * @property {number=} options.step 间隔，默认是 1
     * @property {boolean=} options.scroll 是否可以滚动触发，如果设为 true，需要设置 step
     * @property {string=} options.direction 方向，可选值有 horizontal 和 vertical，默认是 horizontal
     * @property {string=} options.template
     * @property {string=} options.trackSelector
     * @property {string=} options.thumbSelector
     * @property {string=} options.draggingClass 滑块正在拖拽时的 class
     * @property {string=} options.hoverClass 鼠标悬浮滑道时的 class
     * @property {Function=} options.onChange 当 value 变化时触发
     * @property {Function=} options.onBeforeDrag
     * @property {Function=} options.onAfterDrag
     */
    function Slider(options) {
        $.extend(this, Slider.defaultOptions, options);
        this.init();
    }

    Slider.prototype = {

        constructor: Slider,

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;

            element.html(me.template);

            var trackSelector = me.trackSelector;
            var trackElement = trackSelector
                             ? element.find(trackSelector)
                             : element;

            var thumbElement = element.find(me.thumbSelector);

            var cache = me.cache
                      = $.extend(
                            {
                                track: trackElement,
                                thumb: thumbElement
                            },
                            directionConf[ me.direction ]
                        );

            cache.draggable = createDraggable(
                                me,
                                {
                                    element: thumbElement,
                                    container: trackElement,
                                    silence: true,
                                    axis: cache.axis
                                }
                            );

            trackElement.on('click' + namespace, me, clickTrack);

            if (me.hoverClass) {
                trackElement.on('mouseenter' + namespace, me, enterTrack)
                            .on('mouseleave' + namespace, me, leaveTrack);
            }

            if (me.scroll) {
                cache.wheel = new Wheel({
                    element: trackElement,
                    onScroll: function (data) {
                        return !me.setValue( me.value + data.delta * me.step );
                    }
                });
            }

            me.refresh();
        },

        /**
         * 根据当前视图刷新相关计算数值
         *
         * @param {Object} data
         * @property {number=} data.value
         */
        refresh: function (data) {

            var me = this;

            if ($.isPlainObject(data)) {
                $.extend(me, data);
            }

            var cache = me.cache;

            var max = me.max;
            var min = me.min;

            var unit = cache.unit;
            var byUnit = false;

            if ($.isNumeric(unit)) {
                byUnit = unit > 0;
            }
            else if ($.isNumeric(max) && $.isNumeric(min)) {
                byUnit = true;
            }

            var maxPx = cache.draggable.getRectange()[ cache.dimension ];
            if (byUnit) {
                var count = (max - min) / me.step;
                // 保留 2 位小数足够了
                // 如果因为 x.xxx1 这样的精度产生 value 变化
                // 看起来会很奇怪
                unit = (maxPx / count).toFixed(2);
            }
            else {
                me.min = unit = 0;
                me.max = maxPx;
            }

            cache.unit = unit;

            if (me.value != null) {
                me.setValue(me.value, true);
            }
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
         * @param {boolean=} force 是否强制更新
         * @return {boolean} 是否更新成功
         */
        setValue: function (value, force) {

            if (!$.isNumeric(value)) {
                value = Number(value);
            }

            var me = this;
            var max = me.max;
            var min = me.min;

            if (value < min) {
                value = min;
            }
            else if (value > max) {
                value = max;
            }

            if (force || value !== me.value) {

                me.value = value;

                var cache = me.cache;
                var unit = cache.unit;

                // 需要步进
                if (unit > 0) {

                    var step = me.step;

                    // 是否匹配 step
                    if (/^\D+$/.test(value / step)) {
                        throw new Error('[Slider] the value paramater of setValue method is invalid.');
                    }

                    value = unit * (value - min) / step;
                }

                cache.draggable.element
                               .css(cache.position, value);

                if ($.isFunction(me.onChange)) {
                    me.onChange();
                }

                return true;
            }

            return false;
        },

        /**
         * 获取 滑道 和 滑块 的大小
         *
         * @return {Object}
         * @property {number} $return.track
         * @property {number} $return.thumb
         */
        getSize: function () {

            var cache = this.cache;

            return {
                track: cache.track[ cache.innerDimension ](),
                thumb: cache.thumb[ cache.outerDimension ]()
            };
        },

        /**
         * 设置 滑道 和 滑块 的大小
         *
         * @param {Object} data
         * @property {number=} data.track
         * @property {number=} data.thumb
         */
        setSize: function (data) {

            var cache = this.cache;
            var dimension = cache.dimension;
            var offset;

            if ($.isNumeric(data.track)) {

                var track = cache.track;

                offset = track[ cache.innerDimension ]()
                       - track[ dimension ]();

                track[ dimension ](data.track - offset);
            }

            if ($.isNumeric(data.thumb)) {

                var thumb = cache.thumb;

                offset = thumb[ cache.outerDimension ]()
                       - thumb[ dimension ]();

                thumb[ dimension ]( data.thumb - offset);
            }
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;
            var cache = me.cache;

            cache.track.off(namespace);
            cache.draggable.dispose();

            if (cache.wheel) {
                cache.wheel.dispose();
            }

            me.element =
            me.cache = null;
        }

    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Slider.defaultOptions = {

        step: 1,
        scroll: false,
        direction: 'horizontal',

        thumbSelector: '.slider-thumb',
        template: '<i class="slider-thumb"></i>'

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
    var directionConf = {
        horizontal: {
            axis: 'x',
            position: 'left',
            dimension: 'width',
            innerDimension: 'innerWidth',
            outerDimension: 'outerWidth'
        },
        vertical: {
            axis: 'y',
            position: 'top',
            dimension: 'height',
            innerDimension: 'innerHeight',
            outerDimension: 'outerHeight'
        }
    };

    /**
     * 创建可拖拽对象
     *
     * @inner
     * @param {Slider} slider
     * @param {Object} options 创建可拖拽对象的配置
     * @return {Draggable}
     */
    function createDraggable(slider, options) {

        var cache = slider.cache;
        var draggingClass = slider.draggingClass;

        options.onDragStart = function () {

            cache.dragging = true;

            if ($.type(draggingClass) === 'string') {
                options.container
                       .addClass(draggingClass);
            }

            if ($.isFunction(slider.onBeforeDrag)) {
                slider.onBeforeDrag({
                    leave: cache.leave
                });
            }
        };

        options.onDragEnd = function () {

            cache.dragging = false;

            if ($.type(draggingClass) === 'string') {
                options.container
                       .removeClass(draggingClass);
            }

            if ($.isFunction(slider.onAfterDrag)) {
                slider.onAfterDrag({
                    leave: cache.leave
                });
            }
        };

        options.onDrag = function (data) {
            setValueByPx(
                slider,
                data[ cache.position ]
            );
        };

        return new Draggable(options);
    }

    /**
     * 通过像素值设置 value
     *
     * @inner
     * @param {Slider} slider
     * @param {number} value 像素值
     */
    function setValueByPx(slider, value) {

        var unit = slider.cache.unit;

        if (unit > 0) {

            // 转成和 unit 一样的精度
            value = (value).toFixed(2);

            // 第几个 * 步进值
            value = slider.min
                  + Math.floor(value / unit) * slider.step;
        }

        slider.setValue(value);
    }

    /**
     * 点击滑道直接跳转到目标位置
     *
     * @inner
     * @param {Event} e
     */
    function clickTrack(e) {

        var slider = e.data;
        var cache = slider.cache;

        var targetElement = e.target;
        var thumbElement = cache.thumb[0];

        if (targetElement === thumbElement
            || $.contains(thumbElement, targetElement)
        ) {
            return;
        }

        var upper = cache.axis.toUpperCase();
        var value = e[ 'offset' + upper ];

        // FF 不支持 offsetX
        if (!$.isNumeric(value)) {
            value = e[ 'client' + upper ]
                  - cache.track.offset().left;
        }

        setValueByPx(slider, value);
    }

    /**
     * 鼠标进入滑道添加 hoverClass
     *
     * @inner
     * @param {Event} e
     */
    function enterTrack(e) {
        var slider = e.data;
        slider.cache.leave = false;
        slider.element.addClass(slider.hoverClass);
    }

    /**
     * 鼠标离开滑道移除 hoverClass
     *
     * @inner
     * @param {Event} e
     */
    function leaveTrack(e) {

        var slider = e.data;
        var cache = slider.cache;
        var hoverClass = slider.hoverClass;

        cache.leave = true;

        if (!cache.dragging
            || hoverClass !== slider.draggingClass
        ) {
            slider.element.removeClass(hoverClass);
        }
    }


    return Slider;

});
