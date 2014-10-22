/**
 * @file 把小数转成整数，避免小数计算的精度问题
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 把小数转成整数，避免小数计算的精度问题
     *
     * @param {string|number} float 浮点数
     * @param {number=} length 可选，右移的位数
     * @return {number}
     */
    return function (float, length) {

        var parts = ('' + float).split('.');
        var result;

        if (length >= 0) {}
        else {
            length = 0;
        }

        if (parts.length === 1) {
            result = float + new Array(length + 1).join('0');
        }
        else {
            length = Math.max(0, length - parts[1].length);
            result = parts.join('') + new Array(length + 1).join('0');
        }

        return + result;

    };

});