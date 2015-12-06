/**
 * @file 是否支持 canvas
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 是否支持 canvas
     *
     * @return {boolean}
     */
    return function () {

        var canvas = document.createElement('canvas');
        return canvas && canvas.getContext ? true : false;

    };

});