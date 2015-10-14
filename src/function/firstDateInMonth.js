/**
 * @file 月的第一天日期
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var offsetDate = require('./offsetDate');

    return function (date) {

        if ($.type(date) === 'number') {
            date = new Date(date);
        }

        return offsetDate(
            date,
            1 - date.getDate()
        );

    };

});