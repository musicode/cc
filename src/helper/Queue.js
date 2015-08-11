/**
 * @file 队列
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 想象一个场景
     *
     * 当同一时刻接收到一堆消息，你需要一条接一条的滚动显示，它们头尾相接
     *
     * 这时必须有一个队列，控制出队的时机，类似这种问题还有很多，因此可抽象实现
     */

    /**
     *
     * @param {Object} options
     * @property {Function} options.process 有两个参数 (item, callback)
     */
    function Queue(options) {
        $.extend(this, options);
        this.init();
    }

    Queue.prototype = {

        init: function () {

            this.list = [ ];

        },

        add: function (item) {

            var me = this;

            me.list.push(item);

            if (!$.isFunction(me.callback)) {
                me.remove();
            }

        },

        remove: function () {

            var me = this;
            var item = me.list.shift();

            if (item) {

                var callback =

                me.callback = function () {
                    me.callback = null;
                    if (me.list) {
                        me.remove();
                    }
                };

                me.process(item, callback);
            }

        },

        size: function () {
            return this.list.length;
        },

        dispose: function () {

            var me = this;

            me.list =
            me.callback = null;

        }

    };

    return Queue;

});
