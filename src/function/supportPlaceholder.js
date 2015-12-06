/**
 * @file 是否支持 placeholder 特性
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 是否支持 placeholder 特性
     *
     * @return {boolean}
     */
    return function () {

        var element = $('<input type="text" />')[0];
        return 'placeholder' in element;

    };

});