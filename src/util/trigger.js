/**
 * @file 事件触发器
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var split = require('../function/split');

    /**
     * 延时定时器的 key
     *
     * @inner
     * @type {string}
     */
    var delayTimer = 'delayTimer';

    function createHandler(options) {

        return function (e) {

            var delay = options.delay;
            var startDelay = options.startDelay;
            var endDelay = options.endDelay;

            var done = function () {
                options.handler.call(e.currentTarget, e);
            };

            var action = function () {

                if (delay > 0 && startDelay && endDelay) {

                    var startTimer = function () {

                        options[ delayTimer ] = setTimeout(
                            function () {
                                fn(delayTimer);
                            },
                            delay
                        );

                    };

                    var clearTimer = function () {

                        clearTimeout(options[ delayTimer ]);

                        endDelay(fn, options);

                        options[ delayTimer ] = null;

                    };

                    var fn = function (value) {

                        if (options[ delayTimer ]) {
                            clearTimer();
                        }

                        if (delayTimer === value) {
                            done();
                        }

                    };

                    if (!options[ delayTimer ]) {
                        startDelay(fn, options);
                        startTimer();
                    }

                }
                else {
                    done();
                }

            };

            var beforeHandler = options.beforeHandler;
            if ($.isFunction(beforeHandler)) {
                var result = beforeHandler.call(e.currentTarget, e);
                if (result === false) {
                    return;
                }
                else if (result && $.isFunction(result.then)) {
                    result.then(action);
                    return;
                }
            }

            action();

        };

    }

    exports = {
        focus: {
            type: 'focusin',
            handler: createHandler
        },
        blur: {
            type: 'focusout',
            handler: createHandler
        },
        click: {
            type: 'click',
            handler: createHandler
        },
        enter: {
            type: 'mouseenter',
            handler: createHandler
        },
        leave: {
            type: 'mouseleave',
            handler: createHandler
        },
        context: {
            type: 'contextmenu',
            handler: createHandler
        }
    };

    /**
     *
     * @param {string} trigger
     * @param {Function} each
     * @return {Object}
     */
    exports.parse = function (trigger, each) {

        var configs = { };

        if (trigger) {
            $.each(
                split(trigger, ','),
                function (index, trigger) {

                    var config = exports[ trigger ];
                    if (config) {
                        configs[ trigger ] = {
                            type: config.type,
                            handler: config.handler(
                                each(trigger)
                            )
                        };
                    }

                }
            );
        }

        return configs;

    };

    return exports;

});