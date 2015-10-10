/**
 * @file 把 Date 转为字符串格式
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var lpad = require('./lpad');
    var simplifyDate = require('./simplifyDate');

    return function (date, sep) {

        var result = simplifyDate(date);

        if (result) {
            return [
                result.year,
                lpad(result.month),
                lpad(result.date)
            ].join(sep || '-');
        }

        return '';

    };

});