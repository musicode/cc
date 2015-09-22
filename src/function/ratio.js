/**
 * @file 计算比例
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    return function (numerator, denominator) {

        if (numerator >= 0 && denominator > 0) {
            var value = numerator / denominator;
            if (value > 1) {
                value = 1;
            }
            return value;
        }
        else {
            return 0;
        }

    };

});