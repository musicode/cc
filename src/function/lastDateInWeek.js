/**
 * @file 周的最后天日期
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var firstDateInWeek = require('./firstDateInWeek');
    var offsetDate = require('./offsetDate');

    return function (date, firstDay) {
        return offsetDate(
            firstDateInWeek(date, firstDay),
            6
        );
    };

});