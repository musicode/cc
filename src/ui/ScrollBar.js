/**
 * @file ScrollBar
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * @description
     *
     * 通过隐藏原生滚动条，控制元素的 scrollTop 来滚动
     *
     * 核心逻辑分两块
     *
     * 1. 计算 视窗高度 / 内容高度，用这个比值渲染滚动滑块
     * 2. 计算 内容大小 / 滚动条大小，算出滑块每滚动 1px，内容元素滚动多少
     *
     * 其中涉及的兼容问题都交给 Draggable 和 Wheel 解决
     */

    'use strict';

    var Slider = require('./Slider');
    var Wheel = require('../helper/Wheel');
    var contains = require('../function/contains');

    /**
     * 自定义滚动条
     *
     * @constructor
     * @property {Object} options
     * @property {jQuery} options.element 滚动条元素
     * @property {jQuery} options.target 滚动目标
     * @property {number=} options.pos 面板当前滚动的位置
     * @property {number=} options.step 滑动滚轮产生的单位距离
     * @property {boolean=} options.scrollByBar 是否由滚动条带动滚动元素，默认为 true
     * @property {string=} options.direction 滚动方向，可选值有 horizontal 和 vertical，默认是 vertical
     * @property {number=} options.minSize 滚动条的最小大小，避免过小无法操作
     * @property {string=} options.draggingClass 拖拽滑块时的 class
     * @property {string=} options.hoverClass 鼠标悬浮于滚动条时的 class
     * @property {boolean=} options.autoHide 是否开启自动隐藏
     * @property {Function=} options.show 显示滚动条的方式，可自定义显示动画
     * @property {Function=} options.hide 隐藏滚动条的方式，可自定义隐藏动画
     * @property {string=} options.template
     * @property {string=} options.thumbSelector 从 template 选中滑块的选择器
     * @property {Function=} options.onScroll
     * @argument {number} options.onScroll.pos
     */
    function ScrollBar(options) {
        $.extend(this, ScrollBar.defaultOptions, options);
        this.init();
    }

    ScrollBar.prototype = {

        constructor: ScrollBar,

        /**
         * 初始化
         */
        init: function () {

            var me = this;

            var element = me.element;
            var target = me.target;

            var slider = createSlider(me);

            var cache = me.cache
                      = $.extend(
                            {
                                slider: slider,
                                wheel: new Wheel({
                                    element: target,
                                    onScroll: function (data) {
                                        return !slider.setValue(
                                                me.pos + data.delta * cache.step
                                            );
                                    }
                                })
                            },
                            directionConf[ me.direction ]
                        );

            if (me.autoHide) {
                element.on('mouseleave' + namespace, me, leaveViewport);
                target.on('mouseenter' + namespace, me, enterViewport)
                      .on('mouseleave' + namespace, me, leaveViewport);
            }

            me.refresh({ pos: me.pos });
        },

        /**
         * 刷新滚动条
         *
         * @param {Object=} data
         * @property {number=} data.pos
         */
        refresh: function (data) {

            var me = this;

            if ($.isPlainObject(data)) {
                $.extend(me, data);
            }

            var target = me.target;
            var cache = me.cache;

            // 计算视窗和滚动面板的比例
            var viewportSize = cache.getViewportSize(target);
            var contentSize = cache.getContentSize(target) || 1;
            var ratio = cache.ratio
                      = viewportSize / contentSize;

            // 比例小于 1 才需要滚动条
            if (ratio < 1) {

                var slider = cache.slider;

                // 计算滑块大小
                var trackSize = slider.getSize().track;
                slider.setSize({
                    thumb: Math.max(ratio * trackSize, me.minSize)
                });

                var factor = cache.factor
                           = contentSize / trackSize;

                // 实际滚动的单位距离
                var step = cache.step
                         = me.scrollByBar
                         ? me.step
                         : me.step / factor;

                // 如果没有传入 pos
                // 需要从 target 读取 scrollTop/Left 值
                var value = data && data.pos;
                if (!$.isNumeric(value)) {
                    value = target.prop(cache.scroll) / factor;
                }

                slider.refresh({
                    step: step,
                    value: value
                });

                me.show();
            }
            else {
                me.hide();
            }
        },

        /**
         * 设置滚动条的位置
         *
         * @param {number} pos
         * @return {boolean} 是否滚动成功
         */
        scrollTo: function (pos) {

            var me = this;
            var cache = me.cache;

            var slider = cache.slider;
            if (slider.setValue(pos)) {

                scrollTarget(me, slider.getValue());

                return true;
            }

            return false;
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;
            var cache = me.cache;

            if (me.autoHide) {
                me.element.off(namespace);
                me.target.off(namespace);
            }

            cache.slider.dispose();
            cache.wheel.dispose();

            me.element =
            me.target =
            me.cache = null;
        }

    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    ScrollBar.defaultOptions = {
        step: 10,
        minSize: 5,
        autoHide: false,
        scrollByBar: true,
        direction: 'vertical',
        thumbSelector: '.scroll-thumb',
        template: '<i class="scroll-thumb"></i>',
        show: function () {
            this.element.fadeIn(200);
        },
        hide: function () {
            this.element.fadeOut(200);
        }
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_scrollbar';

    /**
     * 配置方向属性
     *
     * @inner
     * @type {Object}
     */
    var directionConf = {
        horizontal: {
            scroll: 'scrollLeft',
            getViewportSize: function (element) {
                return element.innerWidth();
            },
            getContentSize: function (element) {
                return element.prop('scrollWidth');
            }
        },
        vertical: {
            scroll: 'scrollTop',
            getViewportSize: function (element) {
                return element.innerHeight();
            },
            getContentSize: function (element) {
                return element.prop('scrollHeight');
            }
        }
    };


    /**
     * 鼠标进入视窗显示滚动条
     *
     * @inner
     * @param {Event} e
     */
    function enterViewport(e) {

        var scrollBar = e.data;
        var cache = scrollBar.cache;

        cache.leave = false;

        if (scrollBar.element.css('display') === 'none'
            && cache.ratio < 1
        ) {
            scrollBar.show();
        }
    }

    /**
     * 鼠标离开视窗隐藏滚动条
     *
     * @inner
     * @param {Event} e
     */
    function leaveViewport(e) {

        var scrollBar = e.data;
        var relatedTarget = e.relatedTarget;

        if (!contains(scrollBar.element[0], relatedTarget)
            && !contains(scrollBar.target[0], relatedTarget)
        ) {

            var cache = scrollBar.cache;
            cache.leave = true;

            // 如果正在拖拽，忽略
            if (!cache.dragging) {
                scrollBar.hide();
            }
        }
    }

    /**
     * 滚动内容元素
     *
     * @inner
     * @param {ScrollBar} scrollBar
     * @param {number} pos
     */
    function scrollTarget(scrollBar, pos) {

        var cache = scrollBar.cache;

        // 滚动目标元素
        scrollBar.target.prop(cache.scroll, pos * cache.factor);

        scrollBar.pos = pos;

        if (typeof scrollBar.onScroll === 'function') {
            scrollBar.onScroll(pos);
        }
    }

    /**
     * 创建 Slider 对象
     *
     * @inner
     * @param {ScrollBar} scrollBar
     * @return {Slider}
     */
    function createSlider(scrollBar) {
        return new Slider({

            element: scrollBar.element,
            direction: scrollBar.direction,
            step: scrollBar.step,
            scrollable: true,

            hoverClass: scrollBar.hoverClass,
            draggingClass: scrollBar.draggingClass,
            thumbSelector: scrollBar.thumbSelector,
            template: scrollBar.template,

            onBeforeDrag: function () {
                scrollBar.cache.dragging = true;
            },
            onAfterDrag: function () {
                var cache = scrollBar.cache;
                cache.dragging = false;
                if (cache.leave) {
                    scrollBar.hide();
                }
            },
            onChange: function () {
                if (scrollBar.cache) {
                    scrollTarget(scrollBar, this.value);
                }
            }
        });
    }

    return ScrollBar;

});
