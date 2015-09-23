/**
 * @file 定时器
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 定时器
     *
     * @param {Function} fn 定时执行的函数
     * @param {number} interval 定时器间隔
     * @param {number＝} wait 开始定时器的等待时间
     */
    return function (fn, interval, wait) {

        wait = $.type(wait) === 'number' ? wait : 0;

        var timer;

        var process = function () {

            timer = setTimeout(process, interval);

            fn();

        };

        var switcher = {

            start: function () {

                switcher.stop();

                timer = setTimeout(process, wait);

            },

            stop: function () {
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
            }
        };

        return switcher;

    };

});