/**
 * @file 获得网页垂直滚动距离
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 获得网页垂直滚动距离
     *
     * @return {number}
     */
    return function () {
        return Math.max(
                document.body.scrollTop,
                document.documentElement.scrollTop
            );
    };

});