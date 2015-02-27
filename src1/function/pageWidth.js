/**
 * @file 获得网页可滚动宽度
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var page = require('./page');

    /**
     * 获得网页可滚动宽度
     *
     * @return {number}
     */
    return function () {
        var element = page()[0];
        return Math.max(element.scrollWidth, element.clientWidth);
    };

});