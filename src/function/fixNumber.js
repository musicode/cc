/**
 * @file 截断小数
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 截断小数
     *
     * @param {string|number} num 需截断的数字
     * @param {number} length 保留的小数点位数
     * @return {number}
     */
    return function (num, length) {

        if (!$.isNumeric(num)) {
            num = 0;
        }

        return + (num).toFixed(length);

    };

});