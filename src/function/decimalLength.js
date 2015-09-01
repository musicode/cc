/**
 * @file 获得小数的位数
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 获得小数的位数
     *
     * @param {string} str
     * @return {number}
     */
    return function (str) {

        var parts = ('' + str).split('.');

        return parts.length === 2 ? parts[1].length : 0;

    };
});