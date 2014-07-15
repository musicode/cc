/**
 * @file ScrollBar
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * @description
     *
     * 通过隐藏原生滚动条，控制元素的 scrollTop/scrollLeft 实现滚动
     *
     * 核心逻辑分两块
     *
     * 1. 计算 视窗高度 / 内容高度，用这个比值渲染滚动滑块
     * 2. 计算 内容大小 / 滚动条大小，算出滑块每滚动 1px，内容元素滚动多少
     *
     */

    'use strict';

    var Slider = require('./Slider');
    var Wheel = require('../helper/Wheel');

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
     * @property {number=} options.value 面板当前滚动的位置
     * @property {number=} options.step 滑动滚轮产生的单位距离
     * @property {boolean=} options.step4Panel step 是否是 panel 的滚动距离，默认为 false
     *
     * @property {string=} options.orientation  滚动方向，可选值有 horizontal 和 vertical，默认是 vertical
     * @property {number=} options.minWidth 滚动条的最小宽度，当 orientation  为 horizontal 时生效
     * @property {number=} options.minHeight 滚动条的最小高度，当 orientation  为 vertical 时生效
     *
     * @property {Object=} options.selector 选择器
     * @property {string=} options.selector.thumb 从 template 选中滑块的选择器
     *
     * @property {Object=} options.className 样式
     * @property {string=} options.className.dragging 拖拽滑块时的 class
     * @property {string=} options.className.hover 鼠标悬浮于滚动条时的 class
     *
     * @property {Object=} options.animation 动画
     * @property {Function=} options.animation.show 显示滚动条的方式，可自定义显示动画
     * @property {Function=} options.animation.hide 隐藏滚动条的方式，可自定义隐藏动画
     * @property {Function=} options.animation.dragging 通过拖拽改变位置的动画
     * @property {Function=} options.animation.to 通过点击直接设置位置的动画
     *
     * @property {Function=} options.onScroll
     * @argument {number} options.onScroll.value
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
            var panel = me.panel;

            var slider = createSlider(me);

            var cache = me.cache
                      = $.extend(
                            {
                                slider: slider,
                                wheel: new Wheel({
                                    element: panel,
                                    onScroll: function (data) {
                                        return !slider.setValue(
                                                me.value + data.delta * cache.step
                                            );
                                    }
                                })
                            },
                            orientationConf[ me.orientation  ]
                        );

            me.refresh({ value: me.value });
        },

        /**
         * 刷新滚动条
         *
         * @param {Object=} data
         * @property {number=} data.value
         */
        refresh: function (data) {

            var me = this;

            if ($.isPlainObject(data)) {
                $.extend(me, data);
            }

            var panel = me.panel;
            var cache = me.cache;

            // 计算视窗和滚动面板的比例
            var viewportSize = cache.getViewportSize(panel);
            var contentSize = cache.getContentSize(panel) || 1;
            var ratio = cache.ratio
                      = viewportSize / contentSize;

            // 比例小于 1 才需要滚动条
            if (ratio < 1) {

                var slider = cache.slider;
                var trackSize = slider.getSize().track;

                slider.setSize({
                    thumb: Math.max(ratio * trackSize, me[cache.min] || 0)
                });

                var factor = cache.factor
                           = contentSize / trackSize;

                // 实际滚动的单位距离
                var step = cache.step
                         = me.step4Panel
                         ? me.step / factor
                         : me.step;

                // 如果没有传入 value
                // 需要从 panel 读取 scrollTop/Left 值
                var value = data && data.value;
                if (!$.isNumeric(value)) {
                    value = panel.prop(cache.scroll) / factor;
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
         * 显示滚动条
         */
        show: function () {
            this.cache.slider.show();
        },

        /**
         * 隐藏滚动条
         */
        hide: function () {
            this.cache.slider.hide();
        },

        /**
         * 设置滚动条的位置
         *
         * @param {number} value
         * @param {Object=} options
         * @param {number=} options.panel 是否只滚动 panel
         * @return {boolean} 是否滚动成功
         */
        to: function (value, options) {

            var me = this;
            var cache = me.cache;
            var slider = cache.slider;

            if ((options && options.panel)
                || slider.setValue(value)
            ) {

                me.panel.prop(cache.scroll, value * cache.factor);
                me.value = value;

                if ($.isFunction(me.onScroll)) {
                    me.onScroll(value);
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
            var cache = me.cache;

            cache.slider.dispose();
            cache.wheel.dispose();

            me.element =
            me.panel =
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
        step4Panel: false,
        orientation : 'vertical',
        template: '<i class="scroll-thumb"></i>',

        selector: {
            thumb: '.scroll-thumb'
        },
        animation: { },
        className: { }
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
    var orientationConf = {
        horizontal: {
            min: 'minWidth',
            scroll: 'scrollLeft',
            getViewportSize: function (element) {
                return element.innerWidth();
            },
            getContentSize: function (element) {
                return element.prop('scrollWidth');
            }
        },
        vertical: {
            min: 'minHeight',
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
     * 创建 Slider 对象
     *
     * @inner
     * @param {ScrollBar} scrollBar
     * @return {Slider}
     */
    function createSlider(scrollBar) {

        return new Slider({

            element: scrollBar.element,
            orientation: scrollBar.orientation,
            step: scrollBar.step,
            scrollable: true,
            value: scrollBar.value,
            className: scrollBar.className,
            selector: scrollBar.selector,
            animation: scrollBar.animation,
            template: scrollBar.template,

            onChange: function () {
                if (scrollBar.cache) {
                    scrollBar.to(this.value, { panel: true });
                }
            }
        });
    }


    return ScrollBar;

});
