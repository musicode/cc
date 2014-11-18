/**
 * @file HTML5 全屏 API
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var doc = document.documentElement;

    var enter;
    var exit;
    var change;

    if (doc.requestFullscreen) {
        enter = function (element) {
            element.requestFullscreen();
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
        enter = function (element) {
            element.webkitRequestFullScreen();
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
        enter = function (element) {
            element.mozRequestFullScreen();
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

    else if (doc.msRequestFullscreen) {
        enter = function (element) {
            element.msRequestFullscreen();
        };
        exit = function () {
            document.msExitFullscreen();
        };
        change = function (handler) {
            document.addEventListener(
                'msfullscreenchange',
                function () {
                    handler(document.msFullscreenElement);
                }
            );
        };
    }
    else if (typeof window.ActiveXObject !== 'undefined') {
        enter = exit = function () {
            var wscript = new ActiveXObject('WScript.Shell');
            if (wscript !== null) {
                wscript.SendKeys('{F11}');
            }
        };
    }
    else {
        enter = exit = $.noop;
    }

    exports.enter = enter;

    exports.exit = exit;

    exports.change = change;

});