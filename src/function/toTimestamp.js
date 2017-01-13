/**
 * @file 转成时间戳
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var toNumber = require('./toNumber');

    var pattern = /(\d{4})-(\d{1,2})-(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})/;

    /**
     * 转成时间戳
     *
     * 大部分场景，后端给的都是时间戳，如果不是，大部分情况都是 Mysql 存储的 YYYY-MM-DD hh:mm:ss 格式
     *
     * @param {*} value
     * @return {*}
     */
    return function (value, defaultValue) {

        var result = toNumber(value);

        if ($.type(result) !== 'number' && $.type(value) === 'string') {
            var match = value.match(pattern);
            if (match) {
                var date = new Date(match[1], match[2] - 1, match[3]);
                date.setHours(match[4]);
                date.setMinutes(match[5]);
                date.setSeconds(match[6]);
                result = date.getTime();
            }
        }

        return $.type(result) === 'number'
            ? result
            : defaultValue;

    };

});