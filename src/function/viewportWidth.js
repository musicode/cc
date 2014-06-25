/**
 * @file 获得视窗宽度
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var viewport = require('./viewport');

    /**
     * 获得视窗宽度
     *
     * @return {number}
     */
    return function () {
        return viewport()[0].clientWidth;
    };

});