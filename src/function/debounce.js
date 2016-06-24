/**
 * @file 节流函数
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 节流调用
     *
     * @param {Function} fn 需要节制调用的函数
     * @param {number=} delay 调用的时间间隔，默认 50ms
     * @param {boolean=} lazy 是否在最后调用
     * @return {Function}
     */
    return function (fn, delay, lazy) {

        delay = $.type(delay) === 'number' ? delay : 50;

        var prevTime;
        var timer;

        function createTimer(args) {
            timer = setTimeout(
                function () {
                    timer = null;
                    prevTime = $.now();
                    fn.apply(null, $.makeArray(args));
                },
                delay
            );
        }

        return function () {

            if (lazy
                && prevTime > 0
                && $.now() - prevTime < delay
            ) {
                clearTimeout(timer);
                timer = null;
            }

            if (!timer) {
                createTimer(arguments);
            }

        };
    };

});