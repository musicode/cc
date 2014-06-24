/**
 * @file 获得视窗高度
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var viewportElement = require('./viewport')()[0];

    /**
     * 获得视窗高度
     *
     * @return {number}
     */
    return function () {
        return viewportElement.clientHeight;
    };

});