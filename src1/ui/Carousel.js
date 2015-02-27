/**
 * @file 轮播
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 90%
     */

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var Switchable = require('../helper/Switchable');


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
     *
     * @property {boolean=} options.autoPlay 是否自动播放，默认 true
     * @property {number=} options.delay 自动播放时，切换的等待时间，默认 5000
     * @property {boolean=} options.loop 是否循环播放，默认为 true
     * @property {boolean=} options.pauseOnHover 是否鼠标 hover 时暂停播放，默认为 true
     *
     * @property {string=} options.trigger 当有图标按钮时，触发改变的方式，可选值有 over click， 默认是 over
     * @property {string=} options.activeClass 转场时会为 icon 切换这个 class
     *
     * @property {string=} options.prevSelector 上一页的选择器
     * @property {string=} options.nextSelector 下一页的选择器
     * @property {string=} options.iconSelector 图标按钮选择器（一般会写序号的小按钮）
     * @property {string} options.itemSelector 幻灯片选择器
     *
     * @property {Function} options.animation 切换动画，必传，否则不会动
     * @argument {Object} options.animation.data
     * @property {number} options.animation.data.to
     * @property {number} options.animation.data.from
     *
     * @property {Function=} options.onChange 索引发生变化时触发
     * @argument {Event} options.onChange.event 事件对象
     * @argument {Object} options.onChange.data 事件数据
     * @property {number} options.onChange.data.to
     * @property {number} options.onChnage.data.from
     */
    function Carousel(options) {
        return lifeCycle.init(this, options);
    }

    Carousel.prototype = {

        constructor: Carousel,

        type: 'Carousel',

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;

            var click = 'click' + namespace;
            var mouseenter = 'mouseenter' + namespace;
            var mouseleave = 'mouseleave' + namespace;

            var prevSelector = me.prevSelector;
            if (prevSelector) {
                element.on(click, prevSelector, $.proxy(me.prev, me));
            }

            var nextSelector = me.nextSelector;
            if (nextSelector) {
                element.on(click, nextSelector, $.proxy(me.next, me));
            }

            var autoPlay = me.autoPlay;
            var itemSelector = me.itemSelector;
            if (autoPlay && me.pauseOnHover) {
                element
                    .on(mouseenter, itemSelector, $.proxy(me.pause, me))
                    .on(mouseleave, itemSelector, $.proxy(me.play, me));
            }

            me.minIndex = 0;
            me.maxIndex = element.find(itemSelector).length - 1
                        - (me.showCount - 1);

            me.switcher = new Switchable({
                element: element,
                index: me.index,
                trigger: me.trigger,
                selector: me.iconSelector,
                activeClass: me.activeClass,
                change: function (data) {

                    me.index = data.to;

                    me.animation(data);

                    me.emit('change', data);

                }
            });

            if (autoPlay) {
                me.play();
            }

        },

        /**
         * 上一个
         */
        prev: function () {

            var me = this;

            var index = me.index - me.step;
            if (index < me.minIndex) {
                if (me.loop) {
                    index = me.maxIndex;
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

            var index = me.index + me.step;
            if (index > me.maxIndex) {
                if (me.loop) {
                    index = me.minIndex;
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

            if (me.autoPlay) {
                me.play(index);
            }
            else {
                me.switcher.to(index);
            }

        },

        /**
         * 开始自动播放
         *
         * @param {number} index
         */
        play: function (index) {

            var me = this;

            if (!me.autoPlay) {
                return;
            }

            // 重新开始当前播放
            if (me.playing) {
                me.pause();
            }

            me.playing = true;

            me.playTimer =
            setTimeout(
                $.proxy(me.next, me),
                me.delay
            );

            if (index !== me.index
                && $.isNumeric(index)
            ) {
                me.switcher.to(index);
            }
        },

        /**
         * 暂停自动播放
         */
        pause: function () {

            var me = this;

            if (!me.autoPlay) {
                return;
            }

            me.playing = false;

            if (me.playTimer) {
                clearTimeout(me.playTimer);
                me.playTimer = null;
            }
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            if (me.playing) {
                me.pause();
            }

            me.element.off(namespace);
            me.switcher.dispose();

            me.element =
            me.switcher = null;
        }
    };

    jquerify(Carousel.prototype);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Carousel.defaultOptions = {
        index: 0,
        step: 1,
        delay: 5000,
        showCount: 1,
        trigger: 'over',
        loop: true,
        autoPlay: true,
        pauseOnHover: true
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_carousel';


    return Carousel;

});