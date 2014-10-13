/**
 * @file 定时器
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 定时器
     *
     * @param {Function} fn 定时执行的函数
     * @param {number} delay 定时器间隔
     * @param {number＝} wait 开始定时器的等待时间
     */
    return function (fn, delay, wait) {

        wait = $.type(wait) === 'number' ? wait : 0;

        var timer;

        return {

            start: function task() {
                fn();
                timer = setTimeout(task, timer ? delay : wait);
            },

            stop: function () {
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
            }
        };

    };

});