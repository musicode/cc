/**
 * @file 处理日期工具
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 年份
     *
     *   YYYY: 四位，如 2014
     *
     * 月份
     *
     *     MM: 两位补零的月份，如 09
     *      M: 没有补零的月份，如 9
     *
     * 月份的第几天
     *
     *     DD: 两位补零的日期，如 09
     *      D: 没有补零的日期，如 9
     *
     * 星期的第几天
     *
     *      d: 0-6
     *
     */


    exports.parse = function (year, month, date) {

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

            if (month >= 0 && month <= 12
                && date >= 0 && date <= 31
            ) {

                var result = new Date();

                result.setFullYear(year);
                // 必须先设置 Date 再设置 Month
                // 不然碰到今天是 29 号的情况，再设置 month 为 1，结果是 3 月
                result.setDate(date);
                result.setMonth(month - 1);

                return result;
            }

        }
    };

    exports.stringify = function (date) {

        if ($.type(date) === 'number') {
            date = new Date(date);
        }

        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var date = date.getDate();

        if (month < 10) {
            month = '0' + month;
        }
        if (date < 10) {
            date = '0' + date;
        }

        return [ year, month, date ].join('-');
    };

    exports.simplify = function (date) {

        if ($.type(date) === 'number') {
            date = new Date(date);
        }

        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            date: date.getDate(),
            day: date.getDay()
        };
    };

    /**
     * 获得 date 所在周的第一天
     *
     * @param {Date|number} date
     * @param {number} firstDay 周的第一天，可选值为 0 - 6
     * @return {Date}
     */
    exports.getWeekFirstDay = function (date, firstDay) {

        if ($.type(date) === 'number') {
            date = new Date(date);
        }

        var day = date.getDay();
        day = day >= firstDay ? day : (day + 7);

        return new Date(
            date.getTime() - (day - firstDay) * exports.DAY
        );

    };

    /**
     * 获得 date 所在周的最后一天
     *
     * @param {Date|number} date
     * @param {number} firstDay 周的第一天，可选值为 0 - 6
     * @return {Date}
     */
    exports.getWeekLastDay = function (date, firstDay) {

        date = exports.getWeekFirstDay(date, firstDay);
        date.setTime(
            date.getTime() + 6 * exports.DAY
        );

        return date;
    };

    /**
     * 获得 date 所在月份的第一天
     *
     * @param {Date|number} date
     * @return {Date}
     */
    exports.getMonthFirstDay = function (date) {

        var time = $.type(date) === 'number'
                 ? date
                 : date.getTime();

        date = new Date(time);
        date.setDate(1);

        return date;
    };

    /**
     * 获得 date 所在月份的最后一天
     *
     * @param {Date|number} date
     * @return {Date}
     */
    exports.getMonthLastDay = function (date) {

        var time = $.type(date) === 'number'
                 ? date
                 : date.getTime();

        date = new Date(time);
        date.setDate(1);
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);

        return date;
    };

    /**
     * 上个月
     *
     * @param {Date|number} date
     * @return {Date}
     */
    exports.prevMonth = function (date) {

        var time = $.type(date) === 'number'
                 ? date
                 : date.getTime();

        date = new Date(time);
        date.setDate(1);
        date.setTime(
            date.getTime() - exports.WEEK
        );

        return date;
    };

    /**
     * 下个月
     *
     * @param {Date|number} date
     * @return {Date}
     */
    exports.nextMonth = function (date) {

        var time = $.type(date) === 'number'
                 ? date
                 : date.getTime();

        date = new Date(time);
        date.setDate(28);
        date.setTime(
            date.getTime() + exports.WEEK
        );

        return date;
    };

    exports.add = function (date, day) {

        return new Date(date.getTime() + day * exports.DAY);

    };

    exports.subtract = function (date, day) {

        return new Date(date.getTime() - day * exports.DAY);

    };

    /**
     * 一天的毫秒数
     *
     * @type {number}
     */
    exports.DAY = 24 * 60 * 60 * 1000;

    /**
     * 一周的毫秒数
     *
     * @type {number}
     */
    exports.WEEK = 7 * exports.DAY;


});