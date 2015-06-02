/**
 * @file 滑动
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var namespace = '.cobble_util_swipe';

    function getPoint(e) {

        e = e.originalEvent;

        var touches = e.changedTouches || e.touches;

        if (touches.length === 1) {
            return touches[0];
        }

    }

    exports.init = function (element) {

        var trigger = function (type, point) {

            var x = point.pageX - start.x;
            var y = point.pageY - start.y;

            var event = $.Event(
                type,
                {
                    x: x,
                    y: y
                }
            );

            element.trigger(event);

            return event;
        };

        var start = { };

        var eventGroup = { };

        // [HACK] fix android 不支持 touchend
        var touchEndTimer;

        eventGroup[ 'touchmove' + namespace ] = function (e) {

            var point = getPoint(e);

            if (point) {

                var event = trigger('swiping', point);

                if (event.isDefaultPrevented()) {
                    e.preventDefault();
                }

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
                trigger('swipe', point);
            }

            element.off(eventGroup);

        };


        element

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
        element.off(namespace);
    };

});