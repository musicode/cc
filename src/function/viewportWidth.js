/**
 * @file 获得视窗宽度
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 获得视窗宽度
     *
     * @return {number}
     */
    return function () {
        return Math.min(
                    document.body.clientWidth,
                    document.documentElement.clientWidth
                );
    };

});