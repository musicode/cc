/**
 * @file 是否是合法的日期对象
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    return function (date) {

        if ($.type(date) !== 'date') {
            return false;
        }

        var time = date.getTime();
        if ($.type(time) === 'number') {
            // 1970/01/01 的日期是 28800000，是长度最小的时间戳
            return ('' + time).length > 8;
        }

        return false;

    };

});