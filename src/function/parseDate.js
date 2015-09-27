/**
 * @file 把字符串格式的日期转为 Date
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    return function (year, month, date) {

        var valid = false;

        if ($.isNumeric(year) && $.isNumeric(month) && $.isNumeric(date)) {
            valid = true;
        }
        else if (arguments.length === 1) {
            valid = true;
            if ($.isPlainObject(year)) {
                date = year.date;
                month = year.month;
                year = year.year;
            }
            else if ($.type(year) === 'string') {
                var parts = year.split('-');
                year = parts[0];
                month = parts[1];
                date = parts[2];
            }
        }

        if (valid) {

            if (String(year).length === 4
                && month >= 1 && month <= 12
                && date >= 1 && date <= 31
            ) {
                return new Date(year, month - 1, date);
            }

        }

    };

});