/**
 * @file 工具库
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 节制函数调用
     *
     * @param {Function} fn 需要节制调用的函数
     * @param {number} wait 调用的时间间隔
     * @return {Function}
     */
    exports.debounce = function (fn, wait) {

        wait = typeof wait === 'number' ? wait : 50;

        var timer;

        return function () {

            if (timer) {
                return;
            }

            var args = arguments;

            timer = setTimeout(function () {
                timer = null;
                fn.apply(null, $.makeArray(args));
            }, wait);

        };
    };

});