/**
 * @file 封装 jq 的 offset 方法，类似 width 和 outerWidth 的关系
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var toNumber = require('./toNumber');

    /**
     * @param {jQuery} element
     * @return {Object}
     */
    return function (element) {

        var offsetData = element.offset();
        var marginLeft = toNumber(element.css('margin-left'), 0, 'int');
        var marginTop = toNumber(element.css('margin-top'), 0, 'int');

        return {
            left: offsetData.left - marginLeft,
            top: offsetData.top - marginTop
        };

    };

});