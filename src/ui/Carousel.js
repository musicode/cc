/**
 * @file 轮播
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 轮播
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 主元素
     *
     * @property {number=} options.index 从第几个开始播放，默认是 0
     * @property {number=} options.step 每次滚动几个，默认是 1
     * @property {number=} options.showCount 显示个数，默认是 1
     * @property {number=} options.delay 每次切换的等待时间，默认 5000
     * @property {boolean=} options.auto 是否自动播放，默认 true
     * @property {boolean=} options.loop 是否循环，即在最后一个调用 next() 是否回到第一个
     * @property {boolean=} options.pauseOnHover 是否鼠标停留在 slide 时暂停播放，默认为 true
     *
     * @property {string=} options.trigger 触发改变的方式，可选值有 over click， 默认是 over
     *
     * @property {Object} options.selector 选择器
     * @property {string=} options.selector.prev
     * @property {string=} options.selector.next
     * @property {string=} options.selector.indicator
     * @property {string} options.selector.slide
     *
     * @property {Object=} options.className 样式
     * @property {string=} options.className.indicatorActive 转场时会为 indicator 切换这个 class
     * @property {string=} options.className.slideActive 转场时会为 slide 切换这个 class
     *
     * @property {Function=} options.animation 动画
     * @argument {Object} options.animation.data
     * @property {number} options.animation.data.toIndex
     * @property {number} options.animation.data.fromIndex
     *
     * @property {Function=} options.onChange 索引发生变化时触发
     * @argument {Object} options.onChange.data
     * @property {number} options.onChange.data.toIndex
     * @property {number} options.onChnage.data.fromIndex
     */
    function Carousel(options) {
        $.extend(this, Carousel.defaultOptions, options);
        this.init();
    }

    Carousel.prototype = {

        constructor: Carousel,

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;

            var selector = me.selector;

            var click = 'click';
            var mouseenter = 'mouseenter';
            var mouseleave = 'mouseleave';

            var prevSelector = selector.prev;
            if (prevSelector) {
                element.on(click + namespace, prevSelector, $.proxy(me.prev, me));
            }

            var nextSelector = selector.next;
            if (nextSelector) {
                element.on(click + namespace, nextSelector, $.proxy(me.next, me));
            }

            var indicatorSelector = selector.indicator;
            if (indicatorSelector) {
                if (me.trigger === click) {
                    element.on(click + namespace, indicatorSelector, me, toSlide);
                }
                else {
                    element.on(mouseenter + namespace, indicatorSelector, me, enterIndicator);
                    element.on(mouseleave + namespace, indicatorSelector, me, leaveIndicator);
                }
            }

            var auto = me.auto;
            var slides = element.find(selector.slide);

            if (auto && me.pauseOnHover) {
                slides.on(mouseenter + namespace, $.proxy(me.pause, me));
                slides.on(mouseleave + namespace, $.proxy(me.play, me));
            }

            me.cache = {
                slides: slides,
                min: 0,
                max: slides.length - 1 - (me.showCount - 1)
            };

            var index = me.index;

            if (auto && $.isNumeric(index)) {
                me.index = null;
                me.play(index);
            }
        },

        /**
         * 上一个
         */
        prev: function () {

            var me = this;
            var cache = me.cache;

            var index = me.index - me.step;
            if (index < cache.min) {
                if (me.loop) {
                    index = me.max;
                }
                else {
                    return;
                }
            }

            me.to(index);

        },

        /**
         * 下一个
         */
        next: function () {

            var me = this;
            var cache = me.cache;

            var index = me.index + me.step;
            if (index > cache.max) {
                if (me.loop) {
                    index = cache.min;
                }
                else {
                    return;
                }
            }

            me.to(index);

        },

        /**
         * 切到第 index 个
         *
         * @param {number} index
         */
        to: function (index) {

            var me = this;
            var cache = me.cache;

            if (cache.playing) {

                if (cache.timer) {
                    clearTimeout(cache.timer);
                }

                cache.timer = setTimeout(
                                function () {
                                    if (me.cache) {
                                        me.next();
                                    }
                                },
                                me.delay
                            );
            }

            var fromIndex = me.index;

            if (fromIndex !== index) {

                me.index = index;

                var data = {
                    fromIndex: fromIndex,
                    toIndex: index
                };

                var animation = me.animation;
                if ($.isFunction(animation)) {
                    animation.call(me, data);
                }

                var element = me.element;
                var selector = me.selector;
                var className = me.className;

                var indicatorSelector = selector.indicator;
                var activeClass = className.indicatorActive;
                if (indicatorSelector && activeClass) {
                    var indicators = element.find(indicatorSelector);
                    indicators.eq(fromIndex).removeClass(activeClass);
                    indicators.eq(index).addClass(activeClass);
                }

                activeClass = className.slideActive;
                if (activeClass) {
                    var slides = cache.slides;
                    slides.eq(fromIndex).removeClass(activeClass);
                    slides.eq(index).addClass(activeClass);
                }

                if ($.isFunction(me.onChange)) {
                    me.onChange(data);
                }
            }
        },

        /**
         * 开始自动播放
         *
         * @param {number} index
         */
        play: function (index) {

            var me = this;
            var cache = me.cache;

            if (!me.auto || cache.playing) {
                return;
            }

            cache.playing = true;

            if (!$.isNumeric(index)) {
                index = me.index;
            }
            me.to(index);
        },

        /**
         * 暂停自动播放
         */
        pause: function () {

            var me = this;
            var cache = me.cache;

            if (!me.auto || !cache.playing) {
                return;
            }

            cache.playing = false;

            if (cache.timer) {
                clearTimeout(cache.timer);
                cache.timer = null;
            }
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            me.pause();

            me.cache.slides.off(namespace);
            me.element.off(namespace);

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
    Carousel.defaultOptions = {
        index: 0,
        step: 1,
        showCount: 1,
        delay: 5000,
        auto: true,
        loop: true,
        pauseOnHover: true,
        trigger: 'over',
        selector: { },
        animation: { },
        className: { }
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_carousel';

    /**
     * 直接跳去第 N 个
     *
     * @inner
     * @param {Event} e
     */
    function toSlide(e) {
        var carousel = e.data;
        var index = carousel.element
                            .find(carousel.selector.indicator)
                            .index(e.currentTarget);

        carousel.to(index);
        return false;
    }

    /**
     * 鼠标移入 indicator 需触发 change
     * 为了避免过于灵敏的触发，需设置延时
     *
     * @inner
     * @param {Event} e
     */
    function enterIndicator(e) {

        var carousel = e.data;
        var index = carousel.element
                            .find(carousel.selector.indicator)
                            .index(e.currentTarget);

        carousel.cache.changeTimer
        = setTimeout(
            function () {
                if (carousel.cache) {
                    carousel.to(Number(index));
                }
            },
            50
        );
    }

    /**
     * 鼠标移出 indicator 需触发 change
     *
     * @inner
     * @param {Event} e
     */
    function leaveIndicator(e) {
        var cache = e.data.cache;
        if (cache.changeTimer) {
            clearTimeout(cache.changeTimer);
            cache.changeTimer = null;
        }
    }


    return Carousel;

});