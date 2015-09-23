/**
 * @file 遍历器
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var createTimer = require('../util/timer');
    var lifeCycle = require('../util/lifeCycle');

    /**
     *
     * @constrctor
     * @param {Object} options
     * @property {number} options.index 当前索引
     * @property {number} options.minIndex 最小索引
     * @property {number} options.maxIndex 最大索引
     * @property {number=} options.defaultIndex 默认索引，默认是 -1
     * @property {number=} options.interval 长按时的遍历时间间隔，单位毫秒，值越小遍历速度越快
     * @property {number=} options.step prev 和 next 的步进值，默认是 1
     * @property {boolean=} options.loop 是否可循环遍历，默认循环
     */
    function Iterator(options) {
        lifeCycle.init(this, options);
    }

    var proto = Iterator.prototype;

    proto.init = function () {

        var me = this;

        me.set({
            index: me.option('index'),
            minIndex: me.option('minIndex'),
            maxIndex: me.option('maxIndex')
        });

    };

    /**
     *
     * @param {boolean} reverse 是否反向
     */
    proto.start = function (reverse) {

        var me = this;
        var interval = me.option('interval');

        var timer = me.inner('timer');
        if (timer) {
            timer.stop();
        }

        if (reverse) {
            timer = createTimer(
                $.proxy(me.prev, me),
                interval,
                interval
            );
        }
        else {
            timer = createTimer(
                $.proxy(me.next, me),
                interval,
                interval
            );
        }

        timer.start();

        me.inner('timer', timer);

    };

    proto.pause = function () {

        var me = this;

        me.inner('timer').stop();
        me.inner('timer', null);

    };

    proto._pause = function () {
        if (!this.inner('timer')) {
            return false;
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

        var index = me.get('index') - me.option('step');
        var minIndex = me.get('minIndex');
        var maxIndex = me.get('maxIndex');

        if (index < minIndex
            || index > maxIndex
        ) {
            index = maxIndex;
        }

        me.set('index', index, { action: 'prev' });

    };

    proto._prev = function () {

        var me = this;

        if (me.get('index') - me.option('step') < me.get('minIndex')) {
            if (!me.option('loop')) {
                return false;
            }
        }

    };

    proto.next = function () {

        var me = this;

        var index = me.get('index') + me.option('step');
        var minIndex = me.get('minIndex');
        var maxIndex = me.get('maxIndex');

        if (index > maxIndex
            || index < minIndex
        ) {
            index = minIndex;
        }

        me.set('index', index, { action: 'next' });

    };

    proto._next = function () {

        var me = this;

        if (me.get('index') + me.option('step') > me.get('maxIndex')) {
            if (!me.option('loop')) {
                return false;
            }
        }

    };

    proto.dispose = function () {

        this.stop();

    };

    lifeCycle.extend(proto);

    Iterator.defaultOptions = {
        loop: true,
        step: 1,
        minIndex: 0,
        interval: 100,
        defaultIndex: -1
    };

    Iterator.propertyValidator = {
        index: function (index) {

            if ($.type(index) !== 'number') {
                index = this.option('defaultIndex');
                if ($.type(index) !== 'number') {
                    throw new Error('[Cobble Error] Iterator index is not a number.');
                }
            }

            return index;

        }
    };


    return Iterator;

});