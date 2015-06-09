/**
 * @file 通过扩展原型，实现 jQuery 的几个常用方法
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var jqPrototype = $.prototype;

    /**
     * 获取组件主元素
     *
     * @inner
     * @param {*} instane
     * @returns {?jQuery}
     */
    function getElement(instane) {
        return instane.faker || instane.element;
    }

    var methods = {

        /**
         * 绑定事件，方法签名和 $.on 相同
         */
        on: function () {
            jqPrototype.on.apply(
                getElement(this),
                arguments
            );
            return this;
        },

        /**
         * 解绑事件，方法签名和 $.off 相同
         */
        off: function () {
            jqPrototype.off.apply(
                getElement(this),
                arguments
            );
            return this;
        },

        /**
         * 触发事件，trigger 比较常用，为了避免重名，换为 emit
         *
         * @param {Event|string} event 事件对象或事件名称
         * @param {Object=} data 事件数据
         * @returns {Event}
         */
        emit: function (event, data) {

            var me = this;
            var element = getElement(me);

            if (!element) {
                return;
            }

            // 确保是 jQuery 事件对象
            if (!event[$.expando]) {
                event = $.type(event) === 'string'
                      ? $.Event(event)
                      : $.Event(null, event);
            }

            // 设置当前实例对象，便于在未知的地方拿到组件实例
            event.cobble = me;

            var args = [event];
            if (data) {
                args.push(data);
            }

            // 首先执行 this.onXXX 函数
            var fn = me[$.camelCase('on-' + event.type)];

            if ($.isFunction(fn)
                && fn.apply(me, args) === false
            ) {
                event.preventDefault();
            }

            if (!event.isPropagationStopped()) {
                jqPrototype.trigger.apply(element, args);
            }

            return event;

        },

        /**
         * 把 target 加到组件元素前面，方法签名和 $.before 相同
         */
        before: function (target) {
            getElement(this).before(target);
        },

        /**
         * 把 target 加到组件元素后面，方法签名和 $.after 相同
         */
        after: function (target) {
            getElement(this).after(target);
        },

        /**
         * 把组件元素加到 target 内部结束位置，方法签名和 $.appendTo 相同
         */
        appendTo: function (target) {
            getElement(this).appendTo(target);
        },

        /**
         * 把组件元素加到 target 内部开始位置，方法签名和 $.prependTo 相同
         */
        prependTo: function (target) {
            getElement(this).prependTo(target);
        }

    };

    return function (protoType) {

        $.each(
            methods,
            function (name, fn) {
                // 如果已实现，不要覆盖
                if (protoType[name] == null) {
                    protoType[name] = fn;
                }
            }
        );

    };

});