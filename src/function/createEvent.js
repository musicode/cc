/**
 * @file 创建 jQuery 事件对象
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    return function (event) {

        if (event && !event[ $.expando ]) {
            event = $.type(event) === 'string' || event.type
                ? $.Event(event)
                : $.Event(null, event);
        }

        return event || $.Event();

    };

});