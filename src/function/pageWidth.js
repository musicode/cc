/**
 * @file 获得网页可滚动宽度
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 获得网页可滚动宽度
     *
     * @return {number}
     */
    return function () {
        return Math.max(
                    document.body.clientWidth,
                    document.documentElement.clientWidth
                );
    };

});