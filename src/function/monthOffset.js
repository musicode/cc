/**
 * @file 月偏移，以月为单位
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 周偏移可以简单的加减 7 天，但是月偏移没有固定的时间跨度
     *
     * 从 1 - 28 号，往前一个月没有问题
     * 但是 29-31 号，前一个月可能没有这几天
     *
     * 既然没有完美的方式，就用最简单的方式，即先转成 1 号，再进行加减
     */

    return function (date, offset) {

        if ($.type(date) === 'date') {
            date = date.getTime();
        }

        date = new Date(date);
        date.setDate(1);
        date.setMonth(date.getMonth() + offset);

        return date;

    };

});