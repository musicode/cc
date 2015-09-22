/**
 * @file 队列
 * @author musicode
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

    var proto = Queue.prototype;

    proto.init = function () {

        this.list = [ ];

    };

    proto.add = function (item) {

        var me = this;

        me.list.push(item);

        if (!$.isFunction(me.waiting)) {
            me.remove();
        }

    };

    proto.remove = function () {

        var me = this;
        var item = me.list.shift();

        if (item) {

            var waiting =

            me.waiting = function () {
                me.waiting = null;
                if (me.list) {
                    me.remove();
                }
            };

            me.process(item, waiting);
        }

    };

    proto.size = function () {
        return this.list.length;
    };

    proto.dispose = function () {

        var me = this;

        me.list =
        me.waiting = null;

    };

    return Queue;

});
