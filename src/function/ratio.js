/**
 * @file 计算比例
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    return function (numerator, denominator) {
        if (numerator >= 0 && denominator > 0) {
            return numerator / denominator;
        }
        return 0;
    };

});