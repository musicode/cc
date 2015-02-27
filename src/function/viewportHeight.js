/**
 * @file 获得视窗高度
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var viewport = require('./viewport');

    /**
     * 获得视窗高度
     *
     * @return {number}
     */
    return function () {
        return viewport()[0].clientHeight;
    };

});