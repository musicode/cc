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

            if (month >= 1 && month <= 12
                && date >= 1 && date <= 31
            ) {
                return new Date(year, month - 1, date);
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

    /**
     * 上周
     *
     * @param {Date|number} date
     * @return {Date}
     */
    exports.prevWeek = function (date) {

        return exports.subtract(date, 7);

    };

    /**
     * 下周
     *
     * @param {Date|number} date
     * @return {Date}
     */
    exports.nextWeek = function (date) {

        return exports.add(date, 7);

    };

    /**
     * 日期增加（未来）
     *
     * @param {Date|number} date
     * @param {number} day
     * @returns {Date}
     */
    exports.add = function (date, day) {

        if ($.type(date) === 'date') {
            date = date.getTime();
        }

        return new Date(date + day * exports.DAY);

    };

    /**
     * 日期减少（以前）
     *
     * @param {Date|number} date
     * @param {number} day
     * @returns {Date}
     */
    exports.subtract = function (date, day) {

        if ($.type(date) === 'date') {
            date = date.getTime();
        }

        return new Date(date - day * exports.DAY);

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