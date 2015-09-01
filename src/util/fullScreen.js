/**
 * @file HTML5 全屏 API
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var doc = document.documentElement;

    var enter;
    var exit;
    var change;

    var noop = $.noop;

    if (doc.requestFullscreen) {
        enter = function () {
            doc.requestFullscreen();
        };
        exit = function () {
            document.exitFullscreen();
        };
        change = function (handler) {
            document.addEventListener(
                'fullscreenchange',
                function () {
                    handler(document.fullscreen);
                }
            );
        };
    }

    else if (doc.webkitRequestFullScreen) {
        enter = function () {
            doc.webkitRequestFullScreen();
        };
        exit = function () {
            document.webkitCancelFullScreen();
        };
        change = function (handler) {
            document.addEventListener(
                'webkitfullscreenchange',
                function () {
                    handler(document.webkitIsFullScreen);
                }
            );
        };
    }

    else if (doc.mozRequestFullScreen) {
        enter = function () {
            doc.mozRequestFullScreen();
        };
        exit = function () {
            document.mozCancelFullScreen();
        };
        change = function (handler) {
            document.addEventListener(
                'mozfullscreenchange',
                function () {
                    handler(document.mozFullScreen);
                }
            );
        };
    }

    // IE 实现有坑，不考虑支持
    else {
        enter = exit = change = noop;
    }

    exports.enter = enter;

    exports.exit = exit;

    exports.change = change;

    exports.support = change !== noop;

});