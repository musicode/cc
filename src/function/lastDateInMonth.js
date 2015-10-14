/**
 * @file 月的第一天日期
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var offsetDate = require('./offsetDate');
    var offsetMonth = require('./offsetMonth');
    var firstDateInMonth = require('./firstDateInMonth');

    return function (date) {

        return offsetDate(
            firstDateInMonth(
                offsetMonth(date, 1)
            ),
            -1
        );

    };

});