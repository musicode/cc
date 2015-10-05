/**
 * @file Draggable
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     *
     * 拖拽元素和容器元素有两种关系：
     *
     * 1. 拖拽元素是容器的子元素，比如对话框是 body 的子元素
     * 2. 拖拽元素不是容器的子元素，比如二者是同级关系，但是视觉上一个比较大，一个比较小，大的看着像容器
     *
     * 拖拽的过程就是不断计算相对于父元素的绝对定位坐标
     *
     *    mousedown 记录鼠标点击位置和元素左上角的偏移坐标，记录拖拽范围
     *    mousemove 获取当前鼠标位置并转换到相对父元素的坐标
     *
     * 元素在容器内拖拽，可拖拽盒模型范围不包括 margin 和 border
     *
     * 拖拽通常会产生大块选区，因为兼容问题，js 无法做到完美解决，必须有 css 配合，因此提供 bodyDraggingClass 选项
     */

    var page = require('../function/page');
    var restrain = require('../function/restrain');
    var position = require('../function/position');
    var contains = require('../function/contains');
    var innerOffset = require('../function/innerOffset');
    var outerOffset = require('../function/outerOffset');
    var pageScrollLeft = require('../function/pageScrollLeft');
    var pageScrollTop = require('../function/pageScrollTop');
    var viewportWidth = require('../function/viewportWidth');
    var viewportHeight = require('../function/viewportHeight');
    var enableSelection = require('../function/enableSelection');
    var disableSelection = require('../function/disableSelection');

    var lifeUtil = require('../util/life');
    var touchUtil = require('../util/touch');
    var bodyElement = require('../util/instance').body;

    /**
     * 拖拽
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 需要拖拽的元素
     * @property {jQuery=} options.containerElement 限制拖拽范围的容器
     * @property {string=} options.draggingClass 拖拽时给 mainElement 添加的 className
     * @property {string=} options.containerDraggingClass 拖拽时给 containerElement 添加的 className
     * @property {string=} options.bodyDraggingClass 拖拽时给 bodyElement 添加的 className，用样式避免出现选区
     *
     * @property {string=} options.axis 限制方向，可选值包括 x y
     *
     * @property {(string|Array.<string>)=} options.handleSelector 触发拖拽的区域
     * @property {(string|Array.<string>)=} options.cancelSelector 不触发拖拽的区域
     *
     * @property {Function} options.dragAnimation
     *
     * @property {Function=} options.onbeforedrag
     * @property {Function=} options.ondrag
     * @property {Function=} options.onafterdrag
     *
     */
    function Draggable(options) {
        lifeUtil.init(this, options);
    }

    var proto = Draggable.prototype;

    proto.type = 'Draggable';

    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');

        mainElement.css(
            position(mainElement)
        );

        me.inner({
            main: mainElement
        });

        var containerElement = me.option('containerElement');
        var pageElement = page();
        var rectElement = containerElement || pageElement;

        var draggingClass = me.option('draggingClass');
        var containerDraggingClass = me.option('containerDraggingClass');
        var bodyDraggingClass = me.option('bodyDraggingClass') || 'dragging';

        var beforeDragHandler = function (e, offset) {

            // 这里本想使用 not 选择器来实现 cancal
            // 但是当 cancel 位于 handle 内部时，mousedown cancel 区域，jq 依然会触发事件
            // 因为有这个问题，索性整个判断都放在这里

            var handleSelector = me.option('handleSelector');
            var cancelSelector = me.option('cancelSelector');

            var target = e.target;

            if (handleSelector && !hitTarget(mainElement, handleSelector, target)
                || cancelSelector && hitTarget(mainElement, cancelSelector, target)
            ) {
                return;
            }




            // 重新取值比较靠谱
            var style = position(mainElement);




            // =====================================================================
            // 计算偏移量
            // 这样方便 onDrag 时作为当前全局坐标的减数，减少计算量
            // =====================================================================

            var coord;

            $.each(globalCoord, function (key, value) {
                if (e.type.indexOf(key) === 0) {
                    coord = value;
                    return false;
                }
            });

            if (!coord) {
                me.error('event[' + type + '] is not supported.');
            }

            var mainOuterOffset = outerOffset(mainElement);
            var rectInnerOffset = innerOffset(rectElement);

            var offsetX;
            var offsetY;

            if (offset) {
                offsetX = offset.x;
                offsetY = offset.y;
            }
            else {
                offsetX = coord.absoluteX(e) - mainOuterOffset.x;
                offsetY = coord.absoluteY(e) - mainOuterOffset.y;
            }

            // 因为 onDrag 是用`全局坐标`减去`偏移量`
            // 所以偏移量应该是全局坐标的偏移量
            var rectContainsElement = contains(rectElement, mainElement);
            if (rectContainsElement) {
                offsetX += rectInnerOffset.x;
                offsetY += rectInnerOffset.y;
            }






            // ====================================================
            // 全局坐标计算函数
            // ====================================================

            point.left = style.left;
            point.top = style.top;

            // 计算拖拽范围
            var x = rectContainsElement ? 0 : rectInnerOffset.x;
            var y = rectContainsElement ? 0 : rectInnerOffset.y;
            var width;
            var height;

            var isFixed = style.position === 'fixed';
            if (isFixed) {

                x -= pageScrollLeft();
                y -= pageScrollTop();

                width = containerElement
                    ? containerElement.innerWidth()
                    : viewportWidth();

                height = containerElement
                    ? containerElement.innerHeight()
                    : viewportHeight();

            }
            else {
                width = rectElement.innerWidth();
                height = rectElement.innerHeight();
            }

            width = Math.max(0, width - mainElement.outerWidth(true));
            height = Math.max(0, height - mainElement.outerHeight(true));

            var axis = me.option('axis');

            xCalculator = axis === 'y'
                        ? calculator.constant(style.left)
                        : calculator.variable(
                            // 全局坐标
                            coord[ isFixed ? 'fixedX' : 'absoluteX' ],
                            // 偏移坐标
                            offsetX,
                            // 约束坐标范围
                            x,
                            x + width
                        );

            yCalculator = axis === 'x'
                        ? calculator.constant(style.top)
                        : calculator.variable(
                            coord[ isFixed ? 'fixedY' : 'absoluteY' ],
                            offsetY,
                            y,
                            y + height
                        );

            counter = 0;

        };

        var dragHandler = function (e) {

            var x = xCalculator(e);
            var y = yCalculator(e);

            if (point.left === x && point.top === y) {
                return;
            }

            point.left = x;
            point.top = y;

            // 不写在 mousedown 是因为鼠标按下不表示开始拖拽
            // 只有坐标发生变动才算
            if (++counter === 1) {

                disableSelection();

                if (draggingClass) {
                    mainElement.addClass(draggingClass);
                }

                if (containerDraggingClass) {
                    containerElement.addClass(containerDraggingClass);
                }

                if (bodyDraggingClass) {
                    bodyElement.addClass(bodyDraggingClass);
                }

                me.emit('beforedrag', point);

            }

            me.execute(
                'dragAnimation',
                {
                    mainElement: mainElement,
                    mainStyle: point
                }
            );

            me.emit('drag', point);

        };

        var afterDragHandler = function (e) {

            enableSelection();

            if (draggingClass) {
                mainElement.removeClass(draggingClass);
            }

            if (containerDraggingClass) {
                containerElement.removeClass(containerDraggingClass);
            }

            if (bodyDraggingClass) {
                bodyElement.removeClass(bodyDraggingClass);
            }

            if (counter > 0) {
                me.emit('afterdrag', point);
            }

            counter =
            xCalculator =
            yCalculator = null;

        };

        me.execute('bind', {
            mainElement: mainElement,
            containerElement: containerElement,
            namespace: me.namespace(),
            downHandler: beforeDragHandler,
            moveHandler: dragHandler,
            upHandler: afterDragHandler
        });

    };

    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.inner('main').off(
            me.namespace()
        );

    };

    lifeUtil.extend(proto);

    //
    // =================================================
    // 因为同一时间只能拖拽一个对象
    // 所以公用下面这些局部变量是安全的
    // =================================================
    //

    /**
     * 当前坐标
     *
     * @inner
     * @type {Object}
     */
    var point = { };

    /**
     * 计算 x 坐标的函数
     *
     * @inner
     * @type {Function}
     */
    var xCalculator;

    /**
     * 计算 y 坐标的函数
     *
     * @inner
     * @type {Function}
     */
    var yCalculator;

    /**
     * 一次拖拽行为的次数计数器
     *
     * @inner
     * @type {number}
     */
    var counter;

    /**
     * 坐标计算器
     *
     * @inner
     * @type {Object}
     */
    var calculator = {

        /**
         * 返回常量
         *
         * @inner
         * @param {number} value
         * @return {Function}
         */
        constant: function (value) {
            return function () {
                return value;
            };
        },

        /**
         * 需要计算
         *
         * @inner
         * @param {Function} fn
         * @param {number} offset 偏移量
         * @param {number} min 最小值
         * @param {number} max 最大值
         * @return {Function}
         */
        variable: function (fn, offset, min, max) {
            return function (e) {
                return restrain(fn(e) - offset, min, max);
            };
        }

    };

    /**
     * 计算全局坐标
     *
     * @inner
     * @type {Object}
     */
    var globalCoord = { };

    $.each(touchUtil, function (key, event) {

        if (!event.support) {
            return;
        }

        globalCoord[ key ] = {
            absoluteX: function (e) {
                return event.client(e).x + pageScrollLeft();
            },
            absoluteY: function (e) {
                return event.client(e).y + pageScrollTop();
            },
            fixedX: function (e) {
                return event.client(e).x;
            },
            fixedY: function (e) {
                return event.client(e).y;
            }
        };

    });

    /**
     * 是否命中目标
     *
     * element 只要有一个命中就返回 true
     *
     * @inner
     * @param {jQuery} element
     * @param {string|Array.<string>} selector
     * @param {jQuery|HTMLElement} target
     * @return {boolean}
     */
    function hitTarget(element, selector, target) {

        var result = false;

        if ($.isArray(selector)) {
            selector = selector.join(',');
        }

        element
        .find(selector)
        .each(
            function () {
                if (result = contains(this, target)) {
                    return false;
                }
            }
        );

        return result;
    }


    return Draggable;

});
