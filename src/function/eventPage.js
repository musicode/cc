/**
 * @file 获得事件的 pageX/pageY
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 获得事件的 pageX/pageY
     *
     * @param {Event} event
     * @return {Object}
     */
    return function (event) {

        var x = event.pageX;
        var y = event.pageY;

        // IE 不支持 pageX/pageY
        if ($.type(x) !== 'number') {
            var documentElement = document.documentElement;
            x = event.clientX + documentElement.scrollLeft;
            y = event.clientY + documentElement.scrollTop;
        }

        return {
            x: x,
            y: y
        };
    };

});