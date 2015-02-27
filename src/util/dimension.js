/**
 * @file dimension
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var pageScrollTop = require('../function/pageScrollTop');
    var pageScrollLeft = require('../function/pageScrollLeft');
    var pageWidth = require('../function/pageWidth');
    var pageHeight = require('../function/pageHeight');
    var viewportWidth = require('../function/viewportWidth');
    var viewportHeight = require('../function/viewportHeight');

    /**
     * 获取网页垂直滚动距离
     *
     * @return {number}
     */
    exports.getPageScrollTop = pageScrollTop;

    /**
     * 获取网页水平滚动距离
     *
     * @return {number}
     */
    exports.getPageScrollLeft = pageScrollLeft;

    /**
     * 获取网页的滚动宽度
     *
     * @return {number}
     */
    exports.getPageWidth = pageWidth;

    /**
     * 获取网页的滚动高度
     *
     * @return {number}
     */
    exports.getPageHeight = pageHeight;

    /**
     * 获取视窗宽度
     *
     * @return {number}
     */
    exports.getViewportWidth = viewportWidth;

    /**
     * 获取视窗高度
     *
     * @return {number}
     */
    exports.getViewportHeight = viewportHeight;

});