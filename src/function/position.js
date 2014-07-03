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
     * @property {string} $return.position
     * @property {number} $return.top
     * @property {number} $return.left
     */
    return function (element) {

        var position = element.css('position');
        var x = parseInt(element.css('left'), 10);
        var y = parseInt(element.css('top'), 10);

        var isAutoX = isNaN(x);
        var isAutoY = isNaN(y);

        if (isAutoX || isAutoY) {

            var parentElement = offsetParent(element);

            if (parentElement.length === 1) {

                var targetOffset = element.offset();
                var containerOffset = parentElement.offset();

                if (isAutoX) {
                    x = targetOffset.left - containerOffset.left;
                }
                if (isAutoY) {
                    y = targetOffset.top - containerOffset.top;
                }
            }
            else {
                x = y = 0;
            }
        }

        if (!position || position === 'static') {
            position = 'absolute';
        }

        return {
            position: position,
            left: x,
            top: y
        };
    };

});