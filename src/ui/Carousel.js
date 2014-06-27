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
     * @property {number=} options.wait 每次等待时间，默认 5000
     * @property {boolean=} options.auto 是否自动播放
     * @property {boolean=} options.cycle 是否循环，即在最后一个调用 next() 是否回到第一个
     * @property {boolean=} options.pauseable 是否鼠标停留在 slide 时暂停播放，默认为 true
     *
     * @property {string=} options.prevSelector
     * @property {string=} options.nextSelector
     * @property {string=} options.indicatorSelector
     * @property {string} options.slideSelector
     *
     * @property {string=} options.indicatorActiveClass
     * @property {string=} options.trigger 触发 change 的方式，可选值有 over click， 默认是 over
     * @property {string=} options.indexAttr indicator 元素存储索引的属性名称
     *
     * @property {Function} options.transition 转场动画函数
     * @argument {Object} options.onChange.data
     * @property {number} options.onChange.data.toIndex
     * @property {number} options.onChnage.data.fromIndex
     *
     * @property {Function} options.onChange index 发生变化时触发
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

            var prevSelector = me.prevSelector;
            if (prevSelector) {
                element.on('click' + namespace, prevSelector, $.proxy(me.prev, me));
            }

            var nextSelector = me.nextSelector;
            if (nextSelector) {
                element.on('click' + namespace, nextSelector, $.proxy(me.next, me));
            }

            var indicatorSelector = me.indicatorSelector;
            var indicatorActiveClass = me.indicatorActiveClass;

            if (indicatorSelector) {

                var type = me.trigger;
                var selector = indicatorSelector
                             + (
                                  indicatorActiveClass
                                ? (':not(.' + indicatorActiveClass +')')
                                : ''
                            );

                if (type === 'click') {
                    element.on('click' + namespace, selector, me, toSlide);
                }
                else if (type === 'over') {
                    element.on('mouseenter' + namespace, selector, me, enterIndicator);
                    element.on('mouseleave' + namespace, selector, me, leaveIndicator);
                }
            }

            var auto = me.auto;
            var slides = element.find(me.slideSelector);
            if (auto && me.pauseable) {
                slides.on('mouseenter' + namespace, $.proxy(me.pause, me));
                slides.on('mouseleave' + namespace, $.proxy(me.play, me));
            }

            me.cache = {
                slides: slides,
                total: slides.length
            };

            var index = me.index;

            // 如果没有设置 index
            // 需要从 indicator 是否有 activeClass 来获取 index
            // 不用 slide 是否有 activeClass 的原因是：
            // 1. 配置项没有 slideActiveClass，因为转场完全交给 transition 处理
            // 2. 从实际运用情况来看，大部分轮播都有 indicator
            if (!$.isNumeric(index)
                && indicatorSelector
                && indicatorActiveClass
            ) {
                var indicators = element.find(indicatorSelector);
                var target = indicators.filter('.' + indicatorActiveClass);

                if (target.length === 1) {
                    index = me.index = indicators.index(target);
                }
            }

            if (auto && $.isNumeric(index)) {
                me.play();
            }
        },

        /**
         * 上一个
         */
        prev: function () {

            var me = this;

            var index = me.index - 1;
            if (index < 0) {
                if (me.cycle) {
                    index = me.cache.total - 1;
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

            var index = me.index + 1;
            if (index >= me.cache.total) {
                if (me.cycle) {
                    index = 0;
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
                                me.wait
                            );
            }

            var fromIndex = me.index;
            if (fromIndex !== index) {

                me.index = index;

                var data = {
                    fromIndex: fromIndex,
                    toIndex: index
                };

                me.transition(data);

                var indicatorSelector = me.indicatorSelector;
                var indicatorActiveClass = me.indicatorActiveClass;

                if (indicatorSelector && indicatorActiveClass) {
                    var indicators = me.element.find(indicatorSelector);
                    indicators.eq(fromIndex).removeClass(indicatorActiveClass);
                    indicators.eq(index).addClass(indicatorActiveClass);
                }

                if ($.isFunction(me.onChange)) {
                    me.onChange(data);
                }
            }
        },

        /**
         * 开始自动播放
         */
        play: function () {

            var me = this;
            var cache = me.cache;

            if (!me.auto || cache.playing) {
                return;
            }

            cache.playing = true;

            me.to(me.index);
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
        wait: 5000,
        auto: true,
        cycle: true,
        pauseable: true,
        trigger: 'over'
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
        var index = $(e.currentTarget).attr(carousel.indexAttr);
        carousel.to(Number(index));
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
        var index = $(e.currentTarget).attr(carousel.indexAttr);

        carousel.cache.changeTimer
        = setTimeout(
            function () {
                if (carousel.cache) {
                    carousel.to(Number(index));
                }
            },
            // 这里给 50 够了，不需要提供配置项
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