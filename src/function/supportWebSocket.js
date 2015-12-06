/**
 * @file 是否支持 websocket
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 是否支持 websocket
     *
     * @return {boolean}
     */
    return function () {

        return typeof window.WebSocket !== 'undefined';

    };

});