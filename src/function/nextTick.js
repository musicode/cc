/**
 * @file 尽可能快的下一次执行
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var instance = require('../util/instance');

    var global = window;
    var result;

    // https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/setImmediate/Overview.html#processingmodel
    if ($.isFunction(global.setImmediate)) {
        result = global.setImmediate;
    }
    else {

        var FLAG = 'musicode';
        var callbacks = $.Callbacks();

        // For modern browser
        var Observer = global.MutationObserver || global.webKitMutationObserver;
        if (Observer) {

            var observer = new Observer(function (mutations) {
                if (mutations[ 0 ].attributeName === FLAG) {
                    callbacks.fire().empty();
                }
            });

            var element = document.createElement('div');
            observer.observe(element, { attributes: true });

            result = function (fn) {
                callbacks.add(fn);
                element.setAttribute(FLAG, $.now());
            };
        }

        // It's faster than `setTimeout`
        else if ($.isFunction(global.postMessage)) {

            instance.window.on(
                'message',
                function (e) {
                    if (e.source === global && e.data === FLAG) {
                        callbacks.fire().empty();
                    }
                }
            );

            result = function (fn) {
                callbacks.add(fn);
                postMessage(FLAG, '*');
            };
        }

        // For older browser
        else {
            result = function (fn) {
                setTimeout(fn, 0);
            };
        }
    }

    return result;

});