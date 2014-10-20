/**
 * @file ScrollBar
 * @author zhujl
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
     */

    'use strict';

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
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
     * @property {string=} options.thumbSelector 从 template 选中滑块的选择器
     *
     * @property {string=} options.draggingClass 拖拽滑块时的 class
     *
     * @property {Function=} options.animation 滚动动画
     *
     * @property {Function=} options.onScroll
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

            me.slider = new Slider({

                element: me.element,
                orientation: me.orientation,
                step: me.step,
                value: me.value,
                scrollable: true,
                draggingClass: me.draggingClass,
                thumbSelector: me.thumbSelector,
                animation: me.animation,
                template: me.template,

                onChange: function () {
                    me.to(
                        this.value,
                        'panel'
                    );
                }
            });

            me.wheel = new Wheel({
                            element: me.panel,
                            onScroll: function (e, data) {
                                return !me.slider.setValue(
                                    me.value + data.delta * me.step
                                );
                            }
                        });

            me.refresh({
                value: me.value
            });

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

            var me = this;

            if ($.isPlainObject(data)) {
                $.extend(me, data);
            }

            var conf = orientationConf[me.orientation];

            var element = me.element;
            var panel = me.panel;

            // 计算视窗和滚动面板的比例
            var viewportSize = conf.getViewportSize(panel);
            var contentSize = conf.getContentSize(panel) || 1;
            var ratio = viewportSize / contentSize;

            // 比例小于 1 才需要滚动条
            if (ratio < 1) {

                var slider = me.slider;
                var trackSize = slider.track[conf.inner]();

                slider.thumb[conf.outer](
                    Math.max(ratio * trackSize, me[conf.min] || 0)
                );

                var factor = me.factor
                           = contentSize / trackSize;

                // 滚动条实际滚动的单位距离
                var step = me.step
                         = me.step4Panel
                         ? me.step / factor
                         : me.step;

                // 如果没有传入 value
                // 需要从 panel 读取 scrollTop/Left 值
                var value = data && data.value;
                if (!$.isNumeric(value)) {
                    value = panel.prop(conf.scroll) / factor;
                }

                // 确保 value 和 this.value 不同
                me.value = !value;

                slider.refresh({
                    step: step,
                    value: value
                });

                element.show();
            }
            else {
                element.hide();
            }
        },

        /**
         * 设置滚动条的位置
         *
         * @param {number} value
         * @param {string=} target 滚动目标，默认滚动 panel 和 bar，也可以指定只滚动其中一个
         * @return {boolean} 是否滚动成功
         */
        to: function (value, target) {

            var result = $.isNumeric(value);

            if (result) {

                var me = this;
                var conf = orientationConf[me.orientation];
                var slider = me.slider;

                if (!target || target !== 'panel') {
                    result = slider.setValue(value);
                }

                if (result) {

                    if (target === 'panel') {
                        me.panel.prop(
                            conf.scroll,
                            value * me.factor
                        );
                    }

                    me.value = value;

                    me.emit(
                        'scroll',
                        {
                            value: value
                        }
                    );

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

            me.slider.dispose();
            me.wheel.dispose();

            me.element =
            me.panel =
            me.slider =
            me.wheel = null;
        }

    };

    jquerify(ScrollBar.prototype);

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
        thumbSelector: '.scroll-thumb'
    };

    /**
     * 配置方向属性
     *
     * @inner
     * @type {Object}
     */
    var orientationConf = {
        horizontal: {
            scroll: 'scrollLeft',
            inner: 'innerWidth',
            outer: 'outerWidth',
            min: 'minWidth',
            getViewportSize: function (element) {
                return element.innerWidth();
            },
            getContentSize: function (element) {
                return element.prop('scrollWidth');
            }
        },
        vertical: {
            scroll: 'scrollTop',
            inner: 'innerHeight',
            outer: 'outerHeight',
            min: 'minHeight',
            getViewportSize: function (element) {
                return element.innerHeight();
            },
            getContentSize: function (element) {
                return element.prop('scrollHeight');
            }
        }
    };

    return ScrollBar;

});
