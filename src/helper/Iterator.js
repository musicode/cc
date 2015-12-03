/**
 * @file 遍历器
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var toNumber = require('../function/toNumber');
    var createTimer = require('../util/timer');
    var lifeUtil = require('../util/life');

    /**
     * 没有主元素，辅助类
     *
     * @constrctor
     * @param {Object} options
     * @property {number} options.index 当前索引，从 0 开始
     * @property {number} options.minIndex 允许的最小索引值
     * @property {number} options.maxIndex 允许的最大索引值
     * @property {number} options.defaultIndex 默认索引值，调用 stop() 会重置为该索引
     * @property {number} options.step 前一个/后一个操作的步进值
     * @property {number} options.interval 自动遍历的时间间隔，单位是毫秒，值越小遍历速度越快
     * @property {boolean=} options.loop 是否循环遍历
     */
    function Iterator(options) {
        lifeUtil.init(this, options);
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
     * 开启自动遍历
     *
     * @param {boolean} reverse 是否反向
     */
    proto.start = function (reverse) {

        var me = this;

        var timer = me.inner('timer');
        if (timer) {
            timer.stop();
        }

        var fn = reverse ? me.prev : me.next;
        var interval = me.option('interval');

        if ($.type(interval) !== 'number') {
            me.error('interval must be a number.');
        }

        timer = createTimer(
            $.proxy(fn, me),
            interval,
            interval
        );

        timer.start();

        me.inner('timer', timer);

    };

    /**
     * 停止自动遍历
     */
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

    /**
     * 停止自动遍历 + 重置索引
     */
    proto.stop = function () {

        var me = this;

        me.pause();
        me.set(
            'index',
            me.option('defaultIndex')
        );

    };



    /**
     * 前一个
     */
    proto.prev = function () {

        var me = this;

        var index = me.get('index') - me.option('step');
        var minIndex = me.get('minIndex');
        var maxIndex = me.get('maxIndex');

        if (!$.isNumeric(index)
            || (index < minIndex || index > maxIndex)
        ) {
            index = maxIndex;
        }

        me.set(
            'index',
            toNumber(index, 0),
            { action: 'prev' }
        );

    };

    proto._prev = function () {

        var me = this;

        if (!me.option('loop')
            && me.get('index') - me.option('step') < me.get('minIndex')
        ) {
            return false;
        }

    };

    /**
     * 后一个
     */
    proto.next = function () {

        var me = this;

        var index = me.get('index') + me.option('step');
        var minIndex = me.get('minIndex');
        var maxIndex = me.get('maxIndex');

        if (!$.isNumeric(index)
            || (index > maxIndex || index < minIndex)
        ) {
            index = minIndex;
        }

        me.set(
            'index',
            toNumber(index, 0),
            { action: 'next' }
        );

    };

    proto._next = function () {

        var me = this;

        if (!me.option('loop')
            && me.get('index') + me.option('step') > me.get('maxIndex')
        ) {
            return false;
        }

    };

    proto.dispose = proto.stop;

    lifeUtil.extend(proto);

    Iterator.propertyValidator = {

        index: function (index) {

            index = toNumber(index, null);

            // 这里不做强校验，避免组合到其他组件中无法使用
            if (index == null) {
                index = this.option('defaultIndex');
            }

            return index;

        }

    };


    return Iterator;

});