/**
 * @file 获得网页可滚动高度
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var page = require('./page');

    /**
     * 获得网页可滚动高度
     *
     * @return {number}
     */
    return function () {
        var element = page()[0];
        return Math.max(element.scrollHeight, element.clientHeight);
    };

});