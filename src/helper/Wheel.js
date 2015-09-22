/**
 * @file Wheel
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 火狐支持 DOMMouseScroll 事件，事件属性为 event.detail
     * 其他浏览器支持 mousewheel 事件，事件属性为 event.wheelDelta
     *
     * event.detail 向上滚动为负值，向下滚动为正值，值为 3 的倍数
     * event.wheelDelta 向下滚动为正值，向上滚动为负值，值为 120 的倍数
     *
     * 此模块统一使用 scroll 事件
     *      统一使用 data.delta
     *      统一为向上为负值，向下为正值，值为 1 的倍数
     */

    var lifeCycle = require('../function/lifeCycle');

    var instance = require('../util/instance');

    /**
     * 处理鼠标滚轮事件
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.watchElement 需要监听鼠标滚轮事件的元素，默认是 document
     */
    function Wheel(options) {
        lifeCycle.init(this, options);
    }

    var proto = Wheel.prototype;

    proto.type = 'Wheel';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        me.option('watchElement').on(
            support + me.namespace(),
            function (e) {

                var event = e.originalEvent;

                var delta;

                var wheelDelta = event.wheelDelta;

                if (wheelDelta % 120 === 0) {
                    delta = -wheelDelta / 120;
                }
                else if (wheelDelta % 3 === 0) {
                    delta = -wheelDelta / 3;
                }
                else if (event.detail % 3 === 0) {
                    delta = -event.detail / 3;
                }
                else {
                    delta = event.delta || 0;
                }

                e.type = 'scroll';
                e.delta = delta;

                me.emit(e);

            }
        );

    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.option('watchElement').off(
            me.namespace()
        );

    };

    lifeCycle.extend(proto);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Wheel.defaultOptions = {
        watchElement: instance.document
    };

    var MOUSE_SCROLL = 'DOMMouseScroll';

    var MOUSE_WHEEL = 'mousewheel';

    /**
     * 支持的滚轮事件名称
     *
     * @inner
     * @type {string}
     */
    var support = ('on' + MOUSE_WHEEL) in instance.body[0]
                ? MOUSE_WHEEL               // Webkit 和 IE 支持 mousewheel
                : MOUSE_SCROLL;             // 火狐的老版本

    return Wheel;

});
