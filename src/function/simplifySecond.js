/**
 * @file 常用于倒计时、或播放器的进度时长之类的
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    return function (second) {

        var MINUTE = 60;
        var HOUR = 60 * MINUTE;
        var DAY = 24 * HOUR;

        // 天数
        var days = Math.floor(second / DAY);
        second = second % DAY;

        // 小时数
        var hours = Math.floor(second / HOUR);
        second = second % HOUR;

        // 分钟数
        var minutes = Math.floor(second / MINUTE);

        // 秒数
        var seconds = second % MINUTE;

        return {
            days: days,
            hours: hours,
            minutes: minutes,
            seconds: seconds
        };

    };

});