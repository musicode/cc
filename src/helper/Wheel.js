/**
 * @file Wheel
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     *
     * 火狐支持 DOMMouseScroll 事件，事件属性为 event.detail
     * 其他浏览器支持 mousewheel 事件，事件属性为 event.wheelDelta
     *
     * event.detail 向上滚动为负值，向下滚动为正值，值为 3 的倍数
     * event.wheelDelta 向下滚动为正值，向上滚动为负值，值为 120 的倍数
     *
     * 此模块统一使用 onScroll 接口
     *      统一使用 event.delta
     *      统一为向上为负值，向下为正值，值为 1 的倍数
     */

    'use strict';

    var lifeCycle = require('../function/lifeCycle');
    var jquerify = require('../function/jquerify');

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

            me.element.on(
                support + namespace,
                function (e) {

                    var delta = 0;

                    var event = e.originalEvent;
                    if (support === 'mousewheel') {
                        delta = - event.wheelDelta / 120;
                    }
                    else {
                        delta = event.detail / 3;
                    }

                    e.type = 'scroll';

                    me.emit(
                        e,
                        {
                            delta: delta
                        }
                    );

                }
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

    /**
     * 支持的滚轮事件名称
     *
     * @inner
     * @type {string}
     */
    var support = 'onmousewheel' in instance.body[0]
                ? 'mousewheel'               // Webkit 和 IE 支持 mousewheel
                : 'DOMMouseScroll';          // 火狐的老版本

    return Wheel;

});
