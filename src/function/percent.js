/**
 * @file 获取百分比
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
            return 100 * value + '%';
        }
        else {
            return 0;
        }

    };

});