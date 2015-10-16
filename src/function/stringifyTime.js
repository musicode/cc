/**
 * @file 把 Date 转为字符串格式
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var lpad = require('./lpad');
    var simplifyTime = require('./simplifyTime');

    return function (date, hasSecond) {

        date = simplifyTime(date);

        if (date) {
            var list = [
                lpad(date.hour),
                lpad(date.minute)
            ];
            if (hasSecond) {
                list.push(
                    lpad(date.second)
                );
            }
            return list.join(':');
        }

        return '';

    };

});