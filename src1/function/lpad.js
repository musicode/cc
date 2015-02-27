/**
 * @file 数字左边补零到两位
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 数字左边补零到两位
     *
     * @param {number} num
     * @return {string}
     */
    return function (num) {
        return (num < 10 ? '0' : '') + num;
    };

});

