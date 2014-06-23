/**
 * @file 获得网页可滚动高度
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 获得网页可滚动高度
     *
     * @return {number}
     */
    return function () {
        return Math.max(
                    document.body.clientHeight,
                    document.documentElement.clientHeight
                );
    };

});