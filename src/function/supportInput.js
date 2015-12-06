/**
 * @file 是否支持 input 事件
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 是否支持 input 事件
     *
     * @return {boolean}
     */
    return function () {

        var element = $('<input type="text" />')[0];
        return 'oninput' in element;

    };

});