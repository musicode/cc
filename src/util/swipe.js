/**
 * @file 滑动
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var namespace = '.cobble_util_swipe';

    function getPoint(e) {

        e = e.originalEvent;

        var touches= e.changedTouches;

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

        };

        var start = { };

        var eventGroup = { };

        eventGroup[ 'touchmove' + namespace ] = function (e) {

            e.preventDefault();

            var point = getPoint(e);

            if (point) {
                trigger('swiping', point);
            }

        };

        eventGroup[ 'touchend' + namespace ] = function (e) {

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