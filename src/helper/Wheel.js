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

    var offsetParent = require('../function/offsetParent');
    var instance = require('../util/instance');

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

            var me = this;
            var element = me.element;

            me.cache = {
                lineHeight: getLineHeight(element),
                pageHeight: element.height()
            };

            element.on(
                support + namespace,
                me,
                support === 'wheel'? onWheel : onMouseWheel
            );
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            me.element.off(namespace);

            me.element =
            me.cache = null;
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Wheel.defaultOptions = {
        element: instance.document
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_helper_wheel';

    var element = $('<div></div>')[0];

    /**
     * 支持的滚轮事件名称
     *
     * @inner
     * @type {string}
     */
    var support = 'onwheel' in element
                ? 'wheel'
                : 'onmousewheel' in element
                  ? 'mousewheel'               // Webkit 和 IE 支持 mousewheel
                  : 'DOMMouseScroll';          // 火狐的老版本


    element = null;


    /**
     * 最新标准滚轮事件
     *
     * @inner
     * @param {Event} e
     */
    function onWheel(e) {

        var wheel = e.data;

        if ($.isFunction(wheel.onScroll)) {

            var event = e.originalEvent;

            // deltaMode 0 is by pixels, nothing to do
            // deltaMode 1 is by lines
            // deltaMode 2 is by pages
            // 统一转成行

            var cache = wheel.cache;
            var factor = 1;

            switch (event.deltaMode) {
                case 0:
                    factor = cache.lineHeight;
                    break;
                case 2:
                    factor = cache.pageHeight;
                    break;
            }

            return wheel.onScroll({
                delta: Math.round(
                            (event.deltaY || event.deltaX) / (3 * factor)
                        )
            });
        }
    }

    /**
     * 获得元素的行高
     * 根据 wheel 事件规范描述，行高要取自 font-size ...
     *
     * @inner
     * @param {jQuery} element
     * @return {number}
     */
    function getLineHeight(element) {
        var parent = offsetParent(element);
        if (!parent.length) {
            parent = instance.body;
        }
        return parseInt(parent.css('font-size'), 10);
    }


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
    function onMouseWheel(e) {

        var originalEvent;

        if (e.type === 'wheel') {
            originalEvent = event;
        }
        else {

            var event = e.originalEvent;

            if (event.type === 'wheel') {
                originalEvent = event;
            }
            else {

                var deltaX;
                var deltaY;

                if (support === 'mousewheel') {
                    deltaY = - (1 / 40) * event.wheelDelta;
                    if (event.wheelDeltaX) {
                        deltaX = - (1 / 40) * event.wheelDeltaX;
                    }
                } else {
                    deltaY = event.detail;
                }

                originalEvent = {
                    deltaMode: 1,
                    deltaX: deltaX,
                    deltaY: deltaY
                };
            }
        }

        onWheel({
            type: 'wheel',
            data: e.data,
            originalEvent: originalEvent
        });
    }


    return Wheel;

});
