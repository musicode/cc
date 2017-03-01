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
     * @param {boolean=} immediate 是否立即执行函数
     * @return {Function}
     */
    return function (fn, delay, immediate) {

        delay = $.type(delay) === 'number' ? delay : 50;

        var timer;

        return function () {

            if (!timer) {
                var context = this;

                var args = $.makeArray(arguments);
                if (immediate) {
                    fn.apply(context, args);
                }

                timer = setTimeout(
                    function () {
                        timer = null;
                        if (!immediate) {
                            fn.apply(context, args);
                        }
                    },
                    delay
                );

            }

        };

    };

});