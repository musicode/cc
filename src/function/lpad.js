/**
 * @file 数字左边补零到两位
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 数字左边补零
     *
     * @param {number} num
     * @param {number} length 长度，如 01 表示长度为 2，001 表示长度为 3，默认为 2
     * @return {string}
     */
    return function (num, length) {

        if (length == null) {
            length = 2;
        }

        var arr = new Array(
            length - ('' + num).length + 1
        );

        return arr.join('0') + num;

    };

});

