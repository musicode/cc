/**
 * @file 日期偏移，以天为单位
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var DAY = 24 * 60 * 60 * 1000;

    return function (date, offset) {

        if ($.type(date) === 'date') {
            date = date.getTime();
        }

        return new Date(date + offset * DAY);

    };

});