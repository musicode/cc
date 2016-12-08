/**
 * @file 串行操作
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 串行操作
     *
     * @param {Array.<Function>} actions 函数数组
     * @param {number} interval 间隔时间
     * @return {Function} 中断函数
     */
    return function (actions, interval) {
        var index = actions.length - 1;
        var timer;

        var handle = function () {
            if (index >= 0) {
                actions[index]();
                timer = setTimeout(
                    function () {
                        timer = null;
                        index--;
                        handle();
                    },
                    interval
                );
            }
        };

        if (index >= 0) {
            handle();
        }

        return function () {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }

});