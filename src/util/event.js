/**
 * @file 使对象具有事件特性
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var extend = require('../function/extend');
    var createEvent = require('../function/createEvent');

    var methods = {

        get$: function () {
            var me = this;
            if (!me.$) {
                me.$ = $({});
            }
            return me.$;
        },

        /**
         * 绑定事件
         */
        on: function (event, data, handler) {
            this.get$().on(event, data, handler);
            return this;
        },

        /**
         * 绑定一次事件
         */
        once: function (event, data, handler) {
            this.get$().one(event, data, handler);
            return this;
        },

        /**
         * 解绑事件
         */
        off: function (event, handler) {
            this.get$().off(event, handler);
            return this;
        },

        /**
         * 触发事件
         *
         * @param {Event|string} event 事件对象或事件名称
         * @param {Object=} data 事件数据
         * @return {Event}
         */
        emit: function (event, data) {
            event = createEvent(event);
            this.get$().trigger(event, data);
            return event;
        }
    };

    exports.extend = function (proto) {
        extend(proto, methods);
    };

});