/**
 * @file Draggable
 * @author zhujl
 */
define(function (require, exports, module) {

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

    'use strict';

    var page = require('../function/page');
    var restrain = require('../function/restrain');
    var position = require('../function/position');
    var contains = require('../function/contains');
    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var pageScrollLeft = require('../function/pageScrollLeft');
    var pageScrollTop = require('../function/pageScrollTop');
    var enableSelection = require('../function/enableSelection');
    var disableSelection = require('../function/disableSelection');

    var instance = require('../util/instance');

    /**
     * 拖拽
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 需要拖拽的元素
     * @property {jQuery=} options.container 限制拖拽范围的容器，默认是 网页元素（元素取决于浏览器）
     *
     * @property {string=} options.axis 限制方向，可选值包括 x y
     * @property {boolean=} options.silence 是否不产生位移，仅把当前坐标通过事件传出去
     *
     * @property {(string|Array.<string>)=} options.handleSelector 触发拖拽的区域
     * @property {(string|Array.<string>)=} options.cancelSelector 不触发拖拽的区域
     *
     * @property {Function=} options.onDragStart 开始拖拽
     * @argument {Object} options.onDragStart.point 坐标点
     *
     * @property {Function=} options.onDrag 正在拖拽
     * @argument {Object} options.onDragStart.point 坐标点
     *
     * @property {Function=} options.onDragEnd 结束拖拽
     * @argument {Object} options.onDragStart.point 坐标点
     */
    function Draggable(options) {
        return lifeCycle.init(this, options);
    }

    Draggable.prototype = {

        constructor: Draggable,

        type: 'Draggable',

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;

            if (!me.container) {
                me.container = page();
            }

            // 这里本想使用 not 选择器 来实现 cancal
            // 但是当 cancel 位于 handle 内部时，mousedown cancel 区域，jq 依然会触发事件
            // 因为有这个问题，索性整个判断都放在 onDragStart 中处理

            element
            .css(position(element))
            .on('mousedown' + namespace, me, onDragStart);
        },

        /**
         * 获得可移动范围的矩形信息
         *
         * @param {boolean=} forDrag 是否是拖拽元素可移动的范围
         * @return {Object}
         */
        getRectange: function (forDrag) {

            var me = this;
            var rect = me.rect;

            if ($.isFunction(rect)) {
                rect = me.rect();
            }

            if (forDrag) {
                var element = me.element;
                var width = rect.width - element.outerWidth(true);
                var height = rect.height - element.outerHeight(true);

                // width/height 有可能比 outerWidth/outerHeight 小
                rect.width = Math.max(0, width);
                rect.height = Math.max(0, height);
            }

            return rect;
        },

        /**
         * 设置容器可移动范围的矩形信息
         *
         * @param {Object|Function} rect
         * @property {number} rect.x 矩形的 x 坐标
         * @property {number} rect.y 矩形的 y 坐标
         * @proeprty {number} rect.width 矩形的宽度
         * @property {number} rect.height 矩形的高度
         */
        setRectange: function (rect) {
            this.rect = rect;
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.element.off(namespace);

            me.element =
            me.container = null;
        }
    };

    jquerify(Draggable.prototype);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Draggable.defaultOptions = {

        rect: function () {

            var me = this;
            var container = me.container;

            var result = {
                x: 0,
                y: 0,
                width: container.innerWidth(),
                height: container.innerHeight()
            };

            // 如果不是父子元素关系，需要把容器的外围信息加上
            if (!contains(container, me.element)) {
                var containerOffset = offset(container);
                result.x = containerOffset.left;
                result.y = containerOffset.top;
            }

            return result;
        }
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_helper_draggable';

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
        change: function (fn, offset, min, max) {
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
    var global = {
        absoluteX: function (e) {
            return e.clientX + pageScrollLeft();
        },
        absoluteY: function (e) {
            return e.clientY + pageScrollTop();
        },
        fixedX: function (e) {
            return e.clientX;
        },
        fixedY: function (e) {
            return e.clientY;
        }
    };

    /**
     * mousedown 触发拖拽
     *
     * 这里把 onDrag 需要的数据都准备好了
     * 原则是尽量减少 onDrag 的计算次数
     *
     * @inner
     * @param {Event} e
     */
    function onDragStart(e) {

        var draggable = e.data;
        var target = e.target;
        var element = draggable.element;

        var handle = draggable.handleSelector;
        var cancel = draggable.cancelSelector;

        if (handle && !hitTarget(element, handle, target)
            || cancel && hitTarget(element, cancel, target)
        ) {
            return;
        }

        // =====================================================
        // 计算偏移量
        // 这样方便 onDrag 时作为当前全局坐标( client 坐标或 page 坐标)的减数，减少计算量
        // =====================================================

        var elementOffset = element.offset();

        // 因为 offset() 包含 margin
        // 所以减去 margin 才是真正的坐标值
        var offsetX = global.absoluteX(e)
                    - (elementOffset.left
                        - (parseInt(element.css('margin-left'), 10) || 0)
                      );
        var offsetY = global.absoluteY(e)
                    - (elementOffset.top
                        - (parseInt(element.css('margin-top'), 10) || 0)
                      );

        // 因为 onDrag 是用`全局坐标`减去偏移量
        // 所以偏移量应该是全局坐标的偏移量
        var container = draggable.container;
        if (contains(container, element)) {
            var containerOffset = offset(container);
            offsetX += containerOffset.left;
            offsetY += containerOffset.top;
        }

        // ====================================================
        // 取最新的坐标值比较靠谱
        // ====================================================
        var style = position(element);
        var pos = style.position;
        point.left = style.left;
        point.top = style.top;

        var axis = draggable.axis;
        var rect = draggable.getRectange(true);

        xCalculator = axis === 'y'
                    ? calculator.constant(point.left)
                    : calculator.change(
                        global[ pos + 'X' ],
                        offsetX,
                        rect.x,
                        rect.x + rect.width
                    );

        yCalculator = axis === 'x'
                    ? calculator.constant(point.top)
                    : calculator.change(
                        global[ pos + 'Y' ],
                        offsetY,
                        rect.y,
                        rect.y + rect.height
                    );

        counter = 0;

        disableSelection();

        instance
        .document
        .on('mousemove' + namespace, draggable, onDrag)
        .on('mouseup' + namespace, draggable, onDragEnd);

    }

    /**
     * 正在拖拽
     *
     * @inner
     * @param {Event} e
     */
    function onDrag(e) {

        var x = xCalculator(e);
        var y = yCalculator(e);

        if (point.left === x && point.top === y) {
            return;
        }

        point.left = x;
        point.top = y;

        var draggable = e.data;

        // 不写在 mousedown 是因为鼠标按下不表示开始拖拽
        // 只有坐标发生变动才算
        if (++counter === 1) {
            draggable.emit('dragStart');
        }

        if (!draggable.silence) {
            draggable.element.css(point);
        }

        draggable.emit('drag', point);

    }

    /**
     * 停止拖拽
     *
     * @inner
     * @param {Event} e
     */
    function onDragEnd(e) {

        enableSelection();

        instance.document.off(namespace);

        var draggable = e.data;

        if (counter > 0) {
            draggable.emit('dragEnd');
        }

        counter =
        xCalculator =
        yCalculator = null;
    }

    /**
     * 是否命中目标
     *
     * container 只要有一个命中就返回 true
     *
     * @inner
     * @param {jQuery} element
     * @param {string|Array.<string>} selector
     * @param {HTMLElement} target
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

    /**
     * 封装 jq 的 offset 方法，使其包含 border 的宽度
     *
     * @inner
     * @param {jQuery} element
     * @return {Object}
     */
    function offset(element) {
        var offsetData = element.offset();
        return {
            left: offsetData.left + (parseInt(element.css('border-left-width'), 10) || 0),
            top: offsetData.top + (parseInt(element.css('border-top-width'), 10) || 0)
        };
    }


    return Draggable;

});
