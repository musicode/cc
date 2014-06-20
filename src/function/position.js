/**
 * @file 获得元素的 left top
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var offsetParent = require('./offsetParent');

    /**
     * 返回元素的定位信息
     *
     * @param {jQuery} element
     * @return {Object}
     */
    return function (element) {

        var x = element.css('left');
        var y = element.css('top');

        var isAutoX = x === 'auto';
        var isAutoY = y === 'auto';

        if (isAutoX || isAutoY) {

            var targetOffset = element.offset();
            var containerOffset = offsetParent(element).offset();

            if (isAutoX) {
                x = targetOffset.left - containerOffset.left;
            }
            if (isAutoY) {
                y = targetOffset.top - containerOffset.top;
            }
        }

        var position = element.css('position');
        if (position === 'static') {
            position = 'absolute';
        }

        return {
            position: position,
            left: x,
            top: y
        };
    }

});