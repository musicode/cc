/**
 * @file 月的第一天日期
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var dateOffset = require('./dateOffset');
    var monthOffset = require('./monthOffset');
    var monthFirst = require('./monthFirst');

    return function (date) {

        return dateOffset(
            monthFirst(
                monthOffset(date, 1)
            ),
            -1
        );

    };

});