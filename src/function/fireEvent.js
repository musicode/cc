/**
 * @file 发送事件
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    return function (element, instance, type, data) {
        element.trigger(
            {
                type: type,
                target: instance
            },
            data
        );
    }
});