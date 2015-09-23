/**
 * @file Draggable
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     *
     * 拖拽有三种场景：
     *
     * 1. 拖拽元素跟 body 是 body > element 关系，常见于 Dialog
     * 2. 拖拽元素有一个单独的容器，常见于自定义滚动条
     * 3. 拖拽元素跟 body 是 body > element 关系，而它的容器元素却不是 body
     *
     * 拖拽的过程就是不断计算相对于父元素的绝对定位坐标
     *
     *     mousedown 记录鼠标点击位置和元素左上角的偏移坐标，记录拖拽范围
     *     mousemove 获取当前鼠标位置并转换到相对父元素的坐标
     *
     * 元素在容器内拖拽，可拖拽盒模型范围不包括 margin 和 border
     */

    var page = require('../function/page');
    var toNumber = require('../function/toNumber');
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

    var instance = require('../util/instance');
    var lifeCycle = require('../util/lifeCycle');
    var supportEvents = require('../util/mouse');

    /**
     * 拖拽
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 需要拖拽的元素
     * @property {jQuery=} options.containerElement 限制拖拽范围的容器，默认是 网页元素（元素取决于浏览器）
     * @property {string=} options.draggingClass 拖拽时给 mainElement 加上的 className
     * @property {string=} options.containerDraggingClass 拖拽时给 containerElement 加上的的 className
     * @property {string=} options.bodyDraggingClass 拖拽时给 document.body 加上的 className，用样式避免出现选区
     *
     * @property {string=} options.axis 限制方向，可选值包括 x y
     *
     * @property {(string|Array.<string>)=} options.handleSelector 触发拖拽的区域
     * @property {(string|Array.<string>)=} options.cancelSelector 不触发拖拽的区域
     *
     * @property {Function=} options.dragAnimate
     *
     */
    function Draggable(options) {
        lifeCycle.init(this, options);
    }

    var proto = Draggable.prototype;

    proto.type = 'Draggable';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');
        me.inner('main', mainElement);

        var containerElement = me.option('containerElement') || page();

        mainElement.css(
            position(mainElement)
        );

        var namespace = me.namespace();

        $.each(supportEvents, function (key, event) {

            if (!event.support) {
                return;
            }

            mainElement.on(
                event.down + namespace,
                function (e) {


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

                    var coord = globalCoord[ key ];

                    var mainOuterOffset = outerOffset(mainElement);
                    var containerInnerOffset = innerOffset(containerElement);

                    // 因为 offset() 包含 margin
                    // 所以减去 margin 才是真正的坐标值
                    var offsetX = coord.absoluteX(e) - mainOuterOffset.x;
                    var offsetY = coord.absoluteY(e) - mainOuterOffset.y;

                    // 因为 onDrag 是用`全局坐标`减去`偏移量`
                    // 所以偏移量应该是全局坐标的偏移量
                    var containerContainsElement = contains(containerElement, mainElement);
                    if (containerContainsElement) {
                        offsetX += containerInnerOffset.x;
                        offsetY += containerInnerOffset.y;
                    }






                    // ====================================================
                    // 全局坐标计算函数
                    // ====================================================

                    point.left = style.left;
                    point.top = style.top;

                    var isFixed = style.position === 'fixed';

                    // 计算拖拽范围
                    var rect = {
                        x: containerContainsElement ? 0 : containerInnerOffset.x,
                        y: containerContainsElement ? 0 : containerInnerOffset.y,
                        width: isFixed ? viewportWidth() : containerElement.innerWidth(),
                        height: isFixed ? viewportHeight() : containerElement.innerHeight()
                    };

                    rect.width = Math.max(0, rect.width - mainElement.outerWidth(true));
                    rect.height = Math.max(0, rect.height - mainElement.outerHeight(true));

                    var axis = me.option('axis');

                    xCalculator = axis === 'y'
                                ? calculator.constant(style.left)
                                : calculator.variable(
                                    // 全局坐标
                                    coord[ isFixed ? 'fixedX' : 'absoluteX' ],
                                    // 偏移坐标
                                    offsetX,
                                    // 约束坐标范围
                                    rect.x,
                                    rect.x + rect.width
                                );

                    yCalculator = axis === 'x'
                                ? calculator.constant(style.top)
                                : calculator.variable(
                                    coord[ isFixed ? 'fixedY' : 'absoluteY' ],
                                    offsetY,
                                    rect.y,
                                    rect.y + rect.height
                                );





                    counter = 0;


                    instance.document
                        .off(namespace)
                        .on(event.move + namespace, onDrag)
                        .on(event.up + namespace, onAfterDrag);


                }
            );

        });

        var draggingClass = me.option('draggingClass');
        var containerDraggingClass = me.option('containerDraggingClass');
        var bodyDraggingClass = me.option('bodyDraggingClass');

        var onDrag = function (e) {

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
                    instance.body.addClass(bodyDraggingClass);
                }

                me.emit('beforedrag', point);

            }

            me.execute(
                'dragAnimate',
                {
                    mainElement: mainElement,
                    mainStyle: point
                }
            );

            me.emit('drag', point);

        };

        var onAfterDrag = function (e) {

            instance.document.off(namespace);

            enableSelection();

            if (draggingClass) {
                mainElement.removeClass(draggingClass);
            }

            if (containerDraggingClass) {
                containerElement.removeClass(containerDraggingClass);
            }

            if (bodyDraggingClass) {
                instance.body.removeClass(bodyDraggingClass);
            }

            if (counter > 0) {
                me.emit('afterdrag', point);
            }

            counter =
            xCalculator =
            yCalculator = null;

        };

    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('main').off(
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
    Draggable.defaultOptions = {
        bodyDraggingClass: 'no-selection',
        dragAnimate: function (options) {
            options.mainElement.css(options.mainStyle);
        }
    };

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

    $.each(supportEvents, function (key, event) {

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
