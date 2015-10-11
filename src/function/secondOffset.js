/**
 * @file 秒偏移
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    return function (date, offset) {

        if ($.type(date) === 'date') {
            date = date.getTime();
        }

        return new Date(date + offset * 1000);

    };

});