/**
 * @file 月的第一天日期
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var dateOffset = require('./dateOffset');

    return function (date) {

        if ($.type(date) === 'number') {
            date = new Date(date);
        }

        return dateOffset(
            date,
            1 - date.getDate()
        );

    };

});