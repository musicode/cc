/**
 * @file 获得事件的 offsetX/offsetY
 * @author zhujl
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

        // Firefox 不支持 offset
        if (typeof x !== 'number') {
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