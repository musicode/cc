/**
 * @file 是否支持 localStorage
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 是否支持 localStorage
     *
     * @return {boolean}
     */
    return function () {

        return typeof window.localStorage !== 'undefined';

    };

});