/**
 * @file 滑动
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var guid = require('../function/guid');

    var DATA_KEY = 'cc-util-swipe';

    var EVENT_SWIPE = 'cc-swipe';
    var EVENT_SWIPING = 'cc-swiping';

    function getPoint(e) {

        e = e.originalEvent;

        var touches = e.changedTouches || e.touches;
        if (touches.length === 1) {
            return touches[0];
        }

    }

    exports.SWIPE = EVENT_SWIPE;
    exports.SWIPING = EVENT_SWIPING;

    exports.init = function (element) {

        var namespace = '.' + guid();

        var trigger = function (e, type, point) {

            var x = point.pageX - start.x;
            var y = point.pageY - start.y;

            e.type = type;

            element.trigger(
                e,
                {
                    x: x,
                    y: y
                }
            );

        };

        var start = { };

        var eventGroup = { };

        // [HACK] fix android 不支持 touchend
        var touchEndTimer;

        eventGroup[ 'touchmove' + namespace ] = function (e) {

            var point = getPoint(e);

            if (point) {

                trigger(e, EVENT_SWIPING, point);

                if (touchEndTimer) {
                    clearTimeout(touchEndTimer);
                }

                touchEndTimer = setTimeout(
                    function () {
                        eventGroup[ 'touchend' + namespace ](e);
                    },
                    200
                );

            }

        };

        eventGroup[ 'touchend' + namespace ] = function (e) {

            if (touchEndTimer) {
                clearTimeout(touchEndTimer);
                touchEndTimer = null;
            }

            var point = getPoint(e);

            if (point) {
                trigger(e, EVENT_SWIPE, point);
            }

            element.off(eventGroup);

        };


        element
            .data(DATA_KEY, namespace)
            .on('touchstart' + namespace, function (e) {

                var point = getPoint(e);

                if (point) {

                    start.x = point.pageX;
                    start.y = point.pageY;
                    start.time = + new Date();

                    element.on(eventGroup);
                }

            });

    };

    exports.dispose = function (element) {

        var namespace = element.data(DATA_KEY);
        if (namespace) {
            element
                .removeData(DATA_KEY)
                .off(namespace);
        }

    };

});