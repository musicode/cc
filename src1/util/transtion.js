/**
 * @file 监听 CSS3 transition end 事件
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 样式名 -> 事件名
     *
     * @inner
     * @type {Object}
     */
    var style2Event = {
        WebkitTransition: 'webkitTransitionEnd',
        MozTransition: 'transitionend',
        OTransition: 'oTransitionEnd otransitionend',
        transition: 'transitionend'
    };

    var element = $('<i></i>')[0];
    var event;

    for (var name in style2Event) {
        if (style2Event.hasOwnProperty(name)) {
            if (name in element.style) {
                event = style2Event[name];
            }
        }
    }


    exports.onend = event
                  ? function (element, handler) {
                        element.one(event, handler);
                    }
                  : function (element, handler) {
                        var duration = element.css('transition-duration').slice(0, -1) * 1000;
                        setTimeout(
                            handler,
                            duration
                        );
                    };

});