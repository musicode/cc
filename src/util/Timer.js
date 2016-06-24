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
     * @property {number} options.timeout 定时器启动间隔
     * @property {number} options.interval 定时器执行间隔
     */
    function Timer(options) {
        $.extend(this, options);
    }

    var proto = Timer.prototype;

    proto.start = function () {

        var me = this;

        me.stop();

        var timeout = me.timeout;
        var interval = me.interval;

        var next = function () {
            me.count++;
            if (me.task() !== false) {
                me.timer = setTimeout(next, interval);
            }
            else {
                me.stop();
            }
        };

        if (timeout == null) {
            timeout = interval;
        }
        me.timer = setTimeout(next, timeout);

    };

    proto.stop = function () {
        var me = this;
        if (me.timer) {
            clearTimeout(me.timer);
            me.timer = null;
            me.count = 0;
        }
    };

    proto.dispose = function () {
        var me = this;
        me.stop();
        me.task =
        me.timeout =
        me.interval = null;
    };

    return Timer;

});