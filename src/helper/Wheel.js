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

    var lifeCycle = require('../function/lifeCycle');
    var jquerify = require('../function/jquerify');
    var offsetParent = require('../function/offsetParent');

    var instance = require('../util/instance');

    /**
     * 处理鼠标滚轮事件
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.element 需要监听鼠标滚轮事件的元素，默认是 document
     * @property {Function=} options.onScroll 滚动事件对外接口，如果返回 false 可阻止默认行为
     * @argument {Object} options.onScroll.data
     * @property {number} options.onScroll.data.delta
     */
    function Wheel(options) {
        return lifeCycle.init(this, options);
    }

    Wheel.prototype = {

        constructor: Wheel,

        type: 'Wheel',

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;

            me.lineHeight = getLineHeight(element);
            me.pageHeight = element.height();

            element.on(
                support + namespace,
                me,
                support === 'wheel' ? onWheel : onMouseWheel
            );
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.element.off(namespace);
            me.element = null;
        }
    };

    jquerify(Wheel.prototype);

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

        var event = e.originalEvent;

        // deltaMode 0 is by pixels, nothing to do
        // deltaMode 1 is by lines
        // deltaMode 2 is by pages
        // 统一转成行

        var factor = 1;

        switch (event.deltaMode) {
            case 0:
                factor = wheel.lineHeight;
                break;
            case 2:
                factor = wheel.pageHeight;
                break;
        }

        var data = {
            delta: Math.round(
                        (event.deltaY || event.deltaX) / (3 * factor)
                    )
        };

        e.type = 'scroll';

        wheel.emit(e, data);

    }


    /**
     * 兼容以前的滚动事件，封装成标准的 wheel 事件
     *
     * @inner
     * @param {Event} e
     */
    function onMouseWheel(e) {

        if (e.type !== 'wheel') {

            var event = e.originalEvent;

            if (event.type !== 'wheel') {

                var deltaX;
                var deltaY;

                if (support === 'mousewheel') {
                    deltaY = - (1 / 40) * event.wheelDelta;
                    if (event.wheelDeltaX) {
                        deltaX = - (1 / 40) * event.wheelDeltaX;
                    }
                }
                else {
                    deltaY = event.detail;
                }

                $.extend(
                    e,
                    {
                        deltaMode: 1,
                        deltaX: deltaX,
                        deltaY: deltaY
                    }
                );
            }
        }

        e.type = 'wheel';

        onWheel(e);

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


    return Wheel;

});
