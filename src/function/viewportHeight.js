/**
 * @file 获得视窗高度
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 获得视窗高度
     *
     * @return {number}
     */
    return function () {
        return window.innerHeight || document.documentElement.clientHeight;
    };

});