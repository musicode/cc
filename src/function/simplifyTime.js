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
            hour: date.getHours(),
            minute: date.getMinutes(),
            second: date.getSeconds()
        };

    };

});