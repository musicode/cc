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
     *     mousemove 获取 (pageX, pageY) 并转换到相对父元素的坐标
     *
     *
     */

    'use strict';

    var offsetParent = require('../function/offsetParent');
    var position = require('../function/position');
    var contains = require('../function/contains');
    var enableSelection = require('../function/enableSelection');
    var disableSelection = require('../function/disableSelection');
    var page = require('../function/page');
    var instance = require('../util/instance');

    /**
     * 拖拽
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 需要拖拽的元素
     * @property {jQuery=} options.container 限制拖拽范围的容器，默认是 网页元素（元素取决于浏览器）
     * @property {string=} options.axis 限制方向，可选值包括 'x' 'y'
     * @property {boolean=} options.silence 是否不产生位移，仅把当前坐标通过事件传出去
     *
     * @property {Object} options.selector 选择器
     * @property {string|Array.<string>)=} options.selector.handle 触发拖拽的区域
     * @property {string|Array.<string>)=} options.selector.cancel 不触发拖拽的区域
     *
     * @property {function(Object)=} options.onDragStart 开始拖拽
     * @property {function(Object)=} options.onDrag 正在拖拽
     * @property {function(Object)=} options.onDragEnd 结束拖拽
     */
    function Draggable(options) {
        $.extend(this, Draggable.defaultOptions, options);
        this.init();
    }

    Draggable.prototype = {

        constructor: Draggable,

        /**
         * 初始化
         */
        init: function () {

            var me = this;

            var element = me.element;
            var container = me.container;
            var isChild = contains(container[0], element[0]);
            var realContainer = isChild ? container : instance.body;

            if (offsetParent(element)[0] !== realContainer[0]) {
                throw new Error('[Draggable] options.element\'s closest unstatic parent element is wrong.');
            }

            var style = position(element);

            me.cache = {
                isChild: isChild,
                position: style.position === 'fixed' ? 'client' : 'page'
            };

            element.css(style)
                   .on('mousedown', me, onDragStart);
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
                rect.width -= element.outerWidth(true);
                rect.height -= element.outerHeight(true);
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
            var cache = me.cache;

            if (cache.onDragEnd) {
                cache.onDragEnd();
            }

            me.element.off('mousedown', onDragStart);

            me.cache =
            me.element =
            me.container = null;
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Draggable.defaultOptions = {

        container: page(),

        selector: { },

        rect: function () {

            var me = this;
            var container = me.container;

            var containerOffset = container.offset();

            var isChild = me.cache.isChild;
            var borderLeftWidth = parseInt(container.css('border-left-width'), 10) || 0;
            var borderTopWidth = parseInt(container.css('border-top-width'), 10) || 0;

            return {

                x: isChild ? 0 : (containerOffset.left + borderLeftWidth),
                y: isChild ? 0 : (containerOffset.top + borderTopWidth),

                width: container.innerWidth(),
                height: container.innerHeight()
            };
        }
    };

    /**
     * mousedown 触发拖拽
     *
     * @inner
     * @param {Event} e
     */
    function onDragStart(e) {

        var draggable = e.data;
        var target = e.target;

        var cache = draggable.cache;
        var element = draggable.element;

        var selector = draggable.selector;

        // 点击在 cancel 区域需要过滤掉
        var cancel = selector.cancel;
        if (cancel && inRegion(target, element, cancel)) {
            return;
        }

        // 点击在 handle 区域之外需要过滤掉
        var handle = selector.handle;
        if (handle && !inRegion(target, element, handle)) {
            return;
        }

        // 计算位置
        var containerOffset = draggable.container.offset();
        var targetOffset = draggable.element.offset();

        var pageX = e.pageX;
        var pageY = e.pageY;

        // 偏移量坐标
        var offsetX = pageX - targetOffset.left;
        var offsetY = pageY - targetOffset.top;

        if (cache.isChild) {
            offsetX += containerOffset.left;
            offsetY += containerOffset.top;
        }

        // 开始点坐标
        var point = cache.point;
        if (!point) {
            var data = position(element);
            point = cache.point
                  = {
                        left: parseInt(data.left, 10),
                        top: parseInt(data.top, 10)
                    };
        }

        cache.originX = point.left;
        cache.originY = point.top;
        cache.offsetX = offsetX;
        cache.offsetY = offsetY;
        cache.marginX = parseInt(element.css('margin-left'), 10) || 0;
        cache.marginY = parseInt(element.css('margin-top'), 10) || 0;
        cache.dragging = false;

        var rect = draggable.getRectange(true);
        cache.movableRect = {
            left: rect.x,
            top: rect.y,
            right: rect.x + rect.width,
            bottom: rect.y + rect.height
        };

        // 避免出现选区
        disableSelection();

        var doc = instance.document;
        doc.on('mousemove', cache.onDrag = onDrag(draggable));
        doc.on('mouseup', cache.onDragEnd = onDragEnd(draggable));

        if ($.isFunction(draggable.onDragStart)) {
            draggable.onDragStart(point);
        }
    }


    /**
     * 正在拖拽
     *
     * @inner
     * @param {Draggable} draggable
     */
    function onDrag(draggable) {

        return function (e) {
            var cache = draggable.cache;
            var axis = draggable.axis;

            // 转为相对于父容器的坐标
            var point = {
                left: axis === 'y' ? cache.originX : (e[ cache.position + 'X' ] - cache.marginX - cache.offsetX),
                top: axis === 'x' ? cache.originY : (e[ cache.position + 'Y' ] - cache.marginY - cache.offsetY)
            };

            // 纠正范围
            restrainPoint(point, cache.movableRect);

            // 如果和上次相同就算了
            var oldPoint = cache.point;
            if (oldPoint.left === point.left && oldPoint.top === point.top) {
                return;
            }
            cache.point = point;

            // 标识拖拽过，而不是 mousedown mouseup 完事
            cache.dragging = true;

            // 如果是静默的，则什么也不做
            if (!draggable.silence) {
                draggable.element.css(point);
            }

            if ($.isFunction(draggable.onDrag)) {
                draggable.onDrag(point);
            }
        };
    }

    /**
     * 停止拖拽
     *
     * @inner
     * @param {Draggable} draggable
     */
    function onDragEnd(draggable) {

        return function () {

            var cache = draggable.cache;

            var doc = instance.document;
            doc.off('mousemove', cache.onDrag)
               .off('mouseup', cache.onDragEnd);

            cache.onDrag =
            cache.onDragEnd = null;

            enableSelection();

            if (cache.dragging) {
                if ($.isFunction(draggable.onDragEnd)) {
                    draggable.onDragEnd(cache.point);
                }
            }
        };
    }

    /**
     * 把坐标约束在 rect 范围内
     *
     * @inner
     * @param {Object} point 坐标点
     * @param {number} point.left
     * @param {number} point.top
     * @param {Object} rect 约束矩形范围
     * @param {number} rect.left
     * @param {number} rect.top
     * @param {number} rect.right
     * @param {number} rect.bottom
     */
    function restrainPoint(point, rect) {

        if (point.left < rect.left) {
            point.left = rect.left;
        }
        else if (point.left > rect.right) {
            point.left = rect.right;
        }

        if (point.top < rect.top) {
            point.top = rect.top;
        }
        else if (point.top > rect.bottom) {
            point.top = rect.bottom;
        }
    }

    /**
     * target 是否落在 container.find(selector) 区域内
     *
     * @inner
     * @param {HTMLElement} target
     * @param {jQuery} container
     * @param {string|Array.<string>} selector
     * @return {boolean}
     */
    function inRegion(target, container, selector) {

        var result = false;

        if ($.type(selector) === 'string') {
            selector = [ selector ];
        }

        $.each(
            selector,
            function (index, item) {
                if (item) {
                    container.find(item).each(
                        function () {
                            if (contains(this, target)) {
                                result = true;
                                return false;
                            }
                        }
                    );
                }
            }
        );

        return result;
    }


    return Draggable;

});
