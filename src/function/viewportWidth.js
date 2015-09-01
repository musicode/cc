/**
 * @file 获得视窗宽度
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 获得视窗宽度
     *
     * @return {number}
     */
    return function () {
        return window.innerWidth || document.documentElement.clientWidth;
    };

});