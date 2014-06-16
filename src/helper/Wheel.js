/**
 * @file Wheel
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * @description
     *
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
     * @property {jQuery=} options.element 需要监听鼠标滚轮事件的元素，默认是 document
     * @property {function(Object)=} options.onScroll 滚动事件对外接口，如果返回 false 可阻止默认行为
     */
    function Wheel(options) {
        $.extend(this, Wheel.defaultOptions, options);
        this.init();
    }

    Wheel.prototype = {

        constructor: Wheel,

        /**
         * 初始化
         */
        init: function () {
            this.element.on(support, this, onScroll);
        },

        /**
         * 销毁对象
         */
        dispose: function () {
            this.element.off(support, onScroll);
            this.element = null;
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Wheel.defaultOptions = {
        element: $(document)
    };


    var element = $('<div></div>')[0];

    /**
     * 支持的滚轮事件名称
     *
     * @inner
     * @type {string}
     */
    var support = 'onwheel' in element
                ? 'wheel'                      // 现代浏览器支持 wheel
                : 'onmousewheel' in element
                  ? 'mousewheel'               // Webkit 和 IE 支持 mousewheel
                  : 'DOMMouseScroll';          // 火狐的老版本

    element = null;

    /**
     * 处理浏览器的兼容问题
     *
     * 向下滚动统一为正数
     * 向上滚动统一为负数
     * 滚动幅度取自 delta 属性
     *
     * @inner
     * @param {Event} e
     */
    function onScroll(e) {

        var wheel = e.data;

        var event = e.originalEvent;
        var delta;

        if (event.wheelDelta) {   // mousewheel
            delta = (-1 / 120) * event.wheelDelta;
        }
        else if (event.detail) {  // DOMMouseScroll
            delta = event.detail / 3;
        }

        // 经过 jquery.mousewheel 处理过的事件
        // 直接从 e 上取值
        if (!delta) {
            delta = -1 * (e.deltaY || e.deltaX);
        }

        if (typeof wheel.onScroll === 'function') {
            return wheel.onScroll({
                delta: delta
            });
        }
    }


    return Wheel;

});
