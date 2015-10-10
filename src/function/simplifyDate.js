/**
 * @file 把 Date 转为人类好理解的格式
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    return function (date) {

        if (!date) {
            return;
        }

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

});