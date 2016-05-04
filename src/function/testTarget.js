/**
 * @file 测试 target 元素是否在指定的选择器内部
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var instance = require('../util/instance');
    var contains = require('./contains');

    /**
     * 测试 target 元素是否在指定的选择器内部
     *
     * @param {jQuery|HTMLElement} target
     * @param {string|Array.<string>} selector
     * @param {jQuery=} context
     * @return {boolean}
     */
    return function (target, selector, context) {

        var result = false;

        if ($.isArray(selector)) {
            selector = selector.join(',');
        }

        if (!context) {
            context = instance.document;
        }

        context
            .find(selector)
            .each(
                function () {
                    if (result = contains(this, target)) {
                        return false;
                    }
                }
            );

        return result;

    };

});