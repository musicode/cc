/**
 * @file 创建一个异步任务
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * ```js
     * var start = createTimer(before, after, 1000)
     * var stop = start();
     * stop();
     * ```
     *
     * 执行一个异步任务
     *
     * @param {Function} before
     * @param {Function} after
     * @param {number} delay 延时
     */
    return function (before, after, delay) {

        var timer;

        var stop = function () {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        };

        return function () {
            stop();
            before();
            timer = setTimeout(
                function () {
                    timer = null;
                    after();
                },
                delay
            );
            return stop;
        };

    };

});