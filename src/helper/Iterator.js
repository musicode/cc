/**
 * @file DOM 遍历器
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var Keyboard = require('./Keyboard');

    var timer = require('../function/timer');
    var lifeCycle = require('../function/lifeCycle');

    /**
     *
     * @param {Object} options
     * @property {jQuery} options.watchElement 监听键盘事件的元素
     * @property {Object} options.index 当前索引，默认是 0
     * @property {number=} options.defaultIndex 默认索引
     * @property {number} options.minIndex 最小索引
     * @property {number} options.maxIndex 最大索引
     * @property {string=} options.prevKey 上一个键名，默认是方向键上（up）
     * @property {string=} options.nextKey 下一个键名，默认是方向键下（down）
     * @property {boolean=} options.loop 是否可循环遍历
     * @property {number=} options.interval 长按时的遍历时间间隔，值越小速度越快
     *
     */
    function Iterator(options) {
        lifeCycle.init(this, options);
    }

    var proto = Iterator.prototype;

    proto.init = function () {

        var me = this;

        var index = me.option('index');
        if ($.type(index) !== 'number') {
            index = me.option('defaultIndex');
        }

        me.set({
            index: index,
            minIndex: me.option('minIndex'),
            maxIndex: me.option('maxIndex')
        });

        var prev = $.proxy(me.prev, me);
        var next = $.proxy(me.next, me);
        var start = $.proxy(me.start, me);
        var pause = $.proxy(me.pause, me);

        var interval = me.option('interval');
        var prevTimer = timer(prev, interval);
        var nextTimer = timer(next, interval);

        var action = { };

        action[ me.option('prevKey') ] = function (e, longPress) {

            if (longPress) {
                return;
            }

            prev();

            me.inner('timer', prevTimer);

        };

        action[ me.option('nextKey') ] = function (e, longPress) {

            if (longPress) {
                return;
            }

            next();

            me.inner('timer', nextTimer);

        };

        var keyboard = new Keyboard({
            watchElement: me.option('watchElement'),
            action: action
        });

        keyboard
        .before('longpress', start)
        .after('longpress', pause);

        me.inner('keyboard', keyboard);

    };

    proto.start = function () {

        var timer = this.inner('timer');

        if (timer) {
            timer.start();
        }

    };

    proto.pause = function () {

        var timer = this.inner('timer');

        if (timer) {
            timer.stop();
            this.inner('timer', null);
        }

    };

    proto.stop = function () {

        var me = this;

        me.pause();

        me.set(
            'index',
            me.option('defaultIndex')
        );

    };

    proto.prev = function () {

        var me = this;

        var index = me.get('index') - 1;

        if (index < me.get('minIndex')) {
            if (me.option('loop')) {
                index = me.get('maxIndex');
            }
            else {
                return;
            }
        }

        me.set('index', index, { action: 'prev' });

    };

    proto.next = function () {

        var me = this;

        var index = me.get('index') + 1;

        if (index > me.get('maxIndex')) {
            if (me.option('loop')) {
                index = me.get('minIndex');
            }
            else {
                return;
            }
        }

        me.set('index', index, { action: 'next' });

    };

    proto.dispose = function () {

        var me = this;

        me.stop();

        me.inner('keyboard').dispose();

    };

    lifeCycle.extend(proto);

    Iterator.defaultOptions = {
        interval: 60,
        loop: true,
        minIndex: 0,
        defaultIndex: -1,
        prevKey: 'up',
        nextKey: 'down'
    };


    return Iterator;

});