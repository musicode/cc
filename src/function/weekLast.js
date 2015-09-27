/**
 * @file 周的最后天日期
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var weekFirst = require('./weekFirst');
    var dateOffset = require('./dateOffset');

    return function (date, firstDay) {
        return dateOffset(
            weekFirst(date, firstDay),
            6
        );
    };

});