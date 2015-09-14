/**
 * @file DOM 遍历器
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 事件列表：
     *
     * 1. change
     */

    var Keyboard = require('./Keyboard');

    var timer = require('../function/timer');
    var jquerify = require('../function/jquerify');
    var setValue = require('../function/setValue');

    /**
     *
     * @param {Object} options
     * @property {jQuery} options.element 监听键盘事件的元素
     * @property {Object} options.data 需要遍历的数据
     * @property {Object} options.index 当前索引，默认是 0
     * @property {number=} options.startIndex 开始索引
     * @property {number} options.minIndex 最小索引
     * @property {number} options.maxIndex 最大索引
     * @property {string=} options.prevKey 上一个键名，默认是方向键上（up）
     * @property {string=} options.nextKey 下一个键名，默认是方向键下（down）
     * @property {boolean=} options.loop 是否可循环遍历
     * @property {number=} options.delay 遍历时间间隔，值越小速度越快
     *
     */
    function Iterator(options) {
        $.extend(this, Iterator.defaultOptions, options);
        this.init();
    }

    Iterator.prototype = {

        constructor: Iterator,

        init: function () {

            var me = this;

            me.setData(me.data);

            var prev = $.proxy(me.prev, me);
            var next = $.proxy(me.next, me);
            var start = $.proxy(me.start, me);
            var pause = $.proxy(me.pause, me);

            var delay = me.delay;
            var prevTimer = timer(prev, delay, delay);
            var nextTimer = timer(next, delay, delay);

            var action = { };

            action[ me.prevKey ] = function (e, longPress) {
                if (!longPress) {
                    prev();
                    me.timer = prevTimer;
                }
            };
            action[ me.nextKey ] = function (e, longPress) {
                if (!longPress) {
                    next();
                    me.timer = nextTimer;
                }
            };

            me.keyboard = new Keyboard({
                element: me.element,
                action: action,
                onBeforeLongPress: start,
                onAfterLongPress: pause
            });

        },

        start: function () {

            var timer = this.timer;

            if (timer) {
                timer.start();
            }

        },

        pause: function () {

            var timer = this.timer;

            if (timer) {
                timer.stop();
                this.timer = null;
            }

        },

        stop: function () {

            var me = this;

            me.pause();

            me.index = me.startIndex;

        },

        getData: function () {

            return this.data;

        },

        setData: function (data) {

            if (!$.isArray(data)) {
                return;
            }

            var me = this;

            me.stop();

            me.data = data;
            me.maxIndex = data.length - 1;

        },

        /**
         *
         * @param {number} index
         * @param {Object=} options 选项
         * @property {boolean=} options.force 是否强制执行，不判断是否跟旧值相同
         * @property {boolean=} options.silence 是否不触发 change 事件
         * @property {string=} options.action 动作类型
         */
        to: function (index, options) {

            setValue(
                this,
                'index',
                index,
                options,
                function (newValue, oldValue, options) {
                    return {
                        from: oldValue,
                        to: newValue,
                        action: options.action || 'to'
                    };
                }
            );

        },

        prev: function () {

            var me = this;

            var index = me.index - 1;

            if (index < me.minIndex) {
                index = me.loop ? me.maxIndex : me.minIndex;
            }

            me.to(
                index,
                {
                    action: 'prev'
                }
            );

        },

        next: function () {

            var me = this;

            var index = me.index + 1;

            if (index > me.maxIndex) {
                index = me.loop ? me.minIndex : me.maxIndex;
            }

            me.to(
                index,
                {
                    action: 'next'
                }
            );

        },

        dispose: function () {

            var me = this;

            me.stop();

            me.keyboard.dispose();

            me.element =
            me.keyboard = null;

        }

    };

    jquerify(Iterator.prototype);


    Iterator.defaultOptions = {
        delay: 60,
        loop: true,
        minIndex: 0,
        startIndex: -1,
        prevKey: 'up',
        nextKey: 'down'
    };


    return Iterator;

});