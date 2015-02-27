/**
 * @file 解析时间（时分秒）
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * HH:mm
     *
     */

    /**
     * 解析时间，参数可以是 '12:30' '12:30:59' 或 (12, 30) (12, 30, 59) 或 { hour: 12, minute: 30 }
     *
     * @inner
     * @param {number|string|Object} hour 时，当 hour 是 string 或 Object 类型时，后两个参数可不传
     * @param {?number} minute 分
     * @param {?number} second 秒
     */
    exports.parse = function (hour, minute, second) {

        var valid = false;

        if ($.isNumeric(hour) && $.isNumeric(minute)) {

            valid = true;

            if (!$.isNumeric(second)) {
                second = 0;
            }

        }
        else if (arguments.length === 1) {

            if ($.type(hour) === 'string') {

                var parts = hour.split(':');

                if (parts.length > 1 && parts.length < 4) {

                    valid = true;

                    hour = + $.trim(parts[0]);
                    minute = + $.trim(parts[1]);
                    second = + $.trim(parts[2]);

                }

            }
            else if ($.isPlainObject(hour)) {

                valid = true;

                second = hour.second || 0;
                minute = hour.minute || 0;
                hour = hour.hour;

            }
        }


        if (valid) {

            if (hour >= 0 && hour <= 23
                && minute >= 0 && minute <= 59
                && second >= 0 && second <= 59
            ) {

                var result = new Date();

                result.setHours(hour);
                result.setMinutes(minute);
                result.setSeconds(second);

                return result;
            }

        }

    };

    exports.stringify = function (date, options) {

        var hour = date.getHours();
        var minute = date.getMinutes();
        var second = date.getSeconds();

        if (hour < 10) {
            hour = '0' + hour;
        }
        if (minute < 10) {
            minute = '0' + minute;
        }
        if (second < 10) {
            second = '0' + second;
        }

        var list = [ ];

        if (!options) {
            options = {
                hour: true,
                minute: true
            };
        }

        if (options.hour) {
            list.push(hour);
        }
        if (options.minute) {
            list.push(minute);
        }
        if (options.second) {
            list.push(second);
        }

        return list.join(':');
    };

    exports.simplify = function (date) {
        return {
            hour: date.getHours(),
            minute: date.getMinutes(),
            second: date.getSeconds()
        };
    };

    exports.add = function (date, options) {

        var offset = 0;

        if ($.type(options.hour) === 'number') {
            offset += exports.HOUR * options.hour;
        }
        if ($.type(options.minute) === 'number') {
            offset += exports.MINUTE * options.minute;
        }
        if ($.type(options.second) === 'number') {
            offset += exports.SECOND * options.second;
        }

        return new Date(date.getTime() + offset);

    };

    exports.subtract = function (date, options) {

        var offset = 0;

        if ($.type(options.hour) === 'number') {
            offset += exports.HOUR * options.hour;
        }
        if ($.type(options.minute) === 'number') {
            offset += exports.MINUTE * options.minute;
        }
        if ($.type(options.second) === 'number') {
            offset += exports.SECOND * options.second;
        }

        return new Date(date.getTime() - offset);
    };

    exports.SECOND = 1000;

    exports.MINUTE = exports.SECOND * 60;

    exports.HOUR = exports.MINUTE * 60;

});