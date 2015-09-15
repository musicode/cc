/**
 * @file 获得事件的 offsetX/offsetY
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 获得事件的 offsetX/offsetY
     *
     * @param {Event} event
     * @return {Object}
     */
    return function (event) {

        var x = event.offsetX;
        var y = event.offsetY;

        // Firefox 不支持 offsetX/offsetY
        if ($.type(x) !== 'number') {
            var rect = event.target.getBoundingClientRect();
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
        }

        return {
            x: x,
            y: y
        };
    };

});