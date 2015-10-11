/**
 * @file 把 Date 转为字符串格式
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var lpad = require('./lpad');
    var simplifyDate = require('./simplifyDate');

    return function (date, options) {

        var hour = lpad(date.getHours());
        var minute = lpad(date.getMinutes());
        var second = lpad(date.getSeconds());

        var list = [ ];

        if (!options) {
            options = {
                hour: true,
                minute: true
            };
        }

        if (options.hour) {
            list.push(hour);
            if (options.minute) {
                list.push(minute);
                if (options.second) {
                    list.push(second);
                }
            }
        }

        return list.length > 1 ? list.join(':') : '';

    };

});