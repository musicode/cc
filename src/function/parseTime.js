/**
 * @file 把字符串格式的时间转为 Date
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    return function (hour, minute, second) {

        var valid = false;

        if ($.isNumeric(hour) && $.isNumeric(minute)) {

            valid = true;

            if (!$.isNumeric(second)) {
                second = 0;
            }

        }
        else if (arguments.length === 1) {

            if ($.isPlainObject(hour)) {
                valid = true;
                second = hour.second;
                minute = hour.minute;
                hour = hour.hour;
            }
            else if ($.type(hour) === 'string') {

                var parts = hour.split(':');

                if (parts.length > 1 && parts.length < 4) {

                    valid = true;

                    hour = + $.trim(parts[0]);
                    minute = + $.trim(parts[1]);
                    second = + $.trim(parts[2]);

                }

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

});
