/**
 * @file 定时器
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 定时器
     *
     * @param {Object} options
     * @property {Function} options.task 定时执行的函数
     * @property {number} options.interval 定时器间隔
     */
    function Timer(options) {
        $.extend(this, options);
    }

    var proto = Timer.prototype;

    proto.start = function () {

        var me = this;

        me.stop();

        var interval = me.interval;

        var next = function () {
            me.task();
            me.timer = setTimeout(next, interval);
        };

        me.timer = setTimeout(next, interval);

    };

    proto.stop = function () {
        var me = this;
        if (me.timer) {
            clearTimeout(me.timer);
            me.timer = null;
        }
    };

    proto.dispose = function () {
        var me = this;
        me.stop();
        me.task =
        me.interval = null;
    };

    return Timer;

});