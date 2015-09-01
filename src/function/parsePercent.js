/**
 * @file 解析百分比
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var divide = require('./divide');

    /**
     * 提取百分比的正则
     *
     * @inner
     * @type {RegExp}
     */
    var percentExpr = /(-?\d+(\.\d+)?)%/;

    return function (value) {
        if (percentExpr.test(value)) {
            return divide(RegExp.$1, 100);
        }
    };

});