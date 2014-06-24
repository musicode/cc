/**
 * @file 获得网页可滚动高度
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var pageElement = require('./page')()[0];

    /**
     * 获得网页可滚动高度
     *
     * @return {number}
     */
    return function () {
        return pageElement.clientHeight;
    };

});