/**
 * @file 通过扩展原型，实现 jQuery 的几个常用方法
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var jqPrototype = $.prototype;

    var methods = {

        on: function () {
            jqPrototype.on.apply(this.element, arguments);
        },

        off: function () {
            jqPrototype.off.apply(this.element, arguments);
        },

        /**
         * 触发事件
         *
         * @param {Event|string} event 事件对象或事件名称
         * @param {*} data 事件数据
         * @returns {*}
         */
        emit: function (event, data) {

            var me = this;
            var element = me.element;

            if (!element) {
                return;
            }

            var result;

            event = event.type
                  ? event
                  : {
                        type: event
                    };

            event.cobble = me;

            var args = [ event ];
            if (data) {
                args.push(data);
            }

            // 首先执行 onXXX 函数
            var fn = me[$.camelCase('on-' + event.type)];
            if ($.isFunction(fn)) {
                result = fn.apply(me, args);
            }

            jqPrototype.trigger.apply(element, args);

            return result;

        },

        before: function (target) {

            var me = this;
            var element = me.faker || me.element;

            element.before(target);
        },

        after: function (target) {

            var me = this;
            var element = me.faker || me.element;

            element.after(target);
        },

        appendTo: function (target) {

            var me = this;
            var element = me.faker || me.element;

            element.appendTo(target);
        },

        prependTo: function (target) {

            var me = this;
            var element = me.faker || me.element;

            element.prependTo(target);
        }

    };

    return function (protoType) {

        $.each(
            methods,
            function (name, fn) {
                if (protoType[name] == null) {
                    protoType[name] = fn;
                }
            }
        );

    };

});