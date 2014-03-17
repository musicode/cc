/**
 * @file WheelScroll
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * 火狐支持 DOMMouseScroll 事件，事件属性为 event.detail
     * 其他浏览器支持 mousewheel 事件，事件属性为 event.wheelDelta
     *
     * event.detail 向上滚动为负值，向下滚动为正值，值为 3 的倍数
     * event.wheelDelta 向下滚动为正值，向上滚动为负值，值为 120 的倍数
     *
     * 此模块统一使用 onScroll 接口
     *       统一使用 event.delta
     *       统一为向上为负值，向下为正值，值为 1 的倍数
     */

    'use strict';


    /**
     * 处理鼠标滚轮事件
     *
     * @constructor
     * @param {Object} options
     * @param {jQuery=} options.element 需要监听鼠标滚轮事件的元素，默认是 document
     * @param {function(Object)=} options.onScroll 滚动事件对外接口，如果返回 false 可阻止默认行为
     */
    function WheelScroll(options) {
        $.extend(this, WheelScroll.defaultOptions, options);
        this.init();
    }

    WheelScroll.prototype = {

        constructor: WheelScroll,

        /**
         * 初始化
         */
        init: function () {
            this.element.on(eventType, this, onScroll);
        },

        /**
         * 销毁对象
         */
        dispose: function () {
            this.element.off(eventType, onScroll);
            this.element = null;
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    WheelScroll.defaultOptions = {
        element: $(document)
    };


    /**
     * 支持的滚轮事件名称
     *
     * @private
     * @type {string}
     */
    var eventType = 'onmousewheel' in document
                  ? 'mousewheel'
                  : 'DOMMouseScroll';

    /**
     * 处理浏览器的兼容问题
     *
     * 向下滚动统一为正数
     * 向上滚动统一为负数
     * 滚动幅度取自 delta 属性
     *
     * @private
     * @param {Event} e
     */
    function onScroll(e) {

        var event = e.originalEvent;
        var wheelScroll = e.data;
        var delta;

        if (event.wheelDelta) {
            delta = -1 * event.wheelDelta / 120;
        }
        else {
            delta = event.detail / 3;
        }

        if (typeof wheelScroll.onScroll === 'function') {
            return wheelScroll.onScroll({
                delta: delta
            });
        }
    }

    return WheelScroll;

});
