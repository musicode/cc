/**
 * @file 约束值
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 约束值
     *
     * @param {number} value
     * @param {number} min 最小值
     * @param {number} max 最大值
     * @return {number}
     */
    return function (value, min, max) {

        if (value < min) {
            value = min;
        }
        else if (value > max) {
            value = max;
        }

        return value;
    };

});