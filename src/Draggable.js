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
     * mousedown 记录鼠标点击位置和元素左上角的偏移坐标，记录拖拽范围
     * mousemove 获取 (pageX, pageY) 并转换到相对父元素的坐标
     *
     * 为了避免拖拽过程产生的选区，可设置 options.draggingBodyClass
     *
     * .draggingBodyClass,
     * .draggingBodyClass * {
     *     -moz-user-select: none;
     *     -webkit-user-select: none;
     *     -ms-user-select: none;
     * }
     */

    'use strict';

    /**
     * 拖拽
     *
     * @constructor
     * @param {Object} options
     * @param {jQuery} options.element 需要拖拽的元素
     * @param {jQuery=} options.containment 限制拖拽范围的容器，默认是 body
     * @param {string=} options.draggingBodyClass 拖拽时给 body 加的 className，可用样式消除拖拽产生的大片选区
     * @param {string=} options.handle 触发拖拽的区域 (css 选择器)
     * @param {string=} options.cancel 不触发拖拽的区域 (css 选择器)
     * @param {string=} options.axis 限制方向，可选值包括 'x' 'y'
     * @param {boolean=} options.silence 是否不产生位移，仅把当前坐标通过事件传出去
     * @param {function(Object)=} options.onDragStart 开始拖拽
     * @param {function(Object)=} options.onDrag 正在拖拽
     * @param {function(Object)=} options.onDragEnd 结束拖拽
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

            var element = this.element;
            var position = element.css('position');

            // 用于存放内部逻辑使用到的私有变量
            this.cache = {
                position: position,
                isChild: contains(this.containment[0], element[0]) // 第三种情况要特殊处理
            };

            if (position !== 'absolute') {
                element.css('position', 'absolute');
            }

            element.on('mousedown', this, startDrag);
        },

        /**
         * 销毁对象
         */
        dispose: function () {
            var element = this.element;
            var cache = this.cache;

            element.off('mousedown', startDrag);
            element.css('position', cache.position);

            this.cache =
            this.element =
            this.containment = null;
        }
    };

    /**
     * document 元素
     *
     * @private
     * @type {jQuery}
     */
    var doc = $(document.documentElement);

    /**
     * body 元素
     *
     * @private
     * @type {jQuery}
     */
    var body = $(document.body);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Draggable.defaultOptions = {
        // 读取高度，不同浏览器需要用不同的元素
        containment: doc.prop('scrollHeight') > body.prop('scrollHeight')
                   ? doc
                   : body
    };

    /**
     * mousedown 触发拖拽
     *
     * @private
     * @param {Event} e
     */
    function startDrag(e) {

        var draggable = e.data;
        var target = e.target;

        var cache = draggable.cache;
        var element = draggable.element;

        // 点击在 cancel 区域需要过滤掉
        var cancel = draggable.cancel;
        if (cancel && inRegion(target, element, cancel)) {
            return;
        }

        // 点击在 handle 区域之外需要过滤掉
        var handle = draggable.handle;
        if (handle && !inRegion(target, element, handle)) {
            return;
        }


        // ==============================================================
        // 计算坐标
        // ==============================================================
        var containerRect = getRectange(draggable.containment);
        var targetRect = getRectange(element);

        // 偏移量坐标
        cache.offsetX = e.pageX - targetRect.left;
        cache.offsetY = e.pageY - targetRect.top;

        if (cache.isChild) {
            cache.offsetX += containerRect.left;
            cache.offsetY += containerRect.top;
        }

        // 开始点坐标
        cache.originX = e.pageX - cache.offsetX;
        cache.originY = e.pageY - cache.offsetY;

        // 可移动的范围
        cache.movableRect = {
            left: 0,
            top: 0,
            right: (containerRect.right - containerRect.left) - (targetRect.right - targetRect.left),
            bottom: (containerRect.bottom - containerRect.top) - (targetRect.bottom - targetRect.top)
        };

        // 避免出现选区
        if (draggable.draggingBodyClass) {
            body.addClass(draggable.draggingBodyClass);
        }

        doc.on('mousemove', draggable, drag);
        doc.on('mouseup', draggable, stopDrag);

        if (typeof draggable.onDragStart === 'function') {
            draggable.onDragStart({
                left: cache.originX,
                top: cache.originY
            });
        }
    }


    /**
     * 正在拖拽
     *
     * @private
     * @param {Event} e
     */
    function drag(e) {

        var draggable = e.data;
        var cache = draggable.cache;
        var axis = draggable.axis;

        // 转为相对于父容器的坐标
        var point = {
            left: axis === 'y' ? cache.originX : (e.pageX - cache.offsetX),
            top: axis === 'x' ? cache.originY : (e.pageY - cache.offsetY)
        };

        // 纠正范围
        restrainPoint(point, cache.movableRect);

        // 如果和上次相同就算了
        var oldPoint = cache.point;
        if (oldPoint
            && oldPoint.left === point.left
            && oldPoint.top === point.top
        ) {
            return;
        }
        cache.point = point;

        // 如果是静默的，则什么也不做
        if (!draggable.silence) {
            draggable.element.css(point);
        }

        if (typeof draggable.onDrag === 'function') {
            draggable.onDrag(point);
        }
    }

    /**
     * 停止拖拽
     *
     * @private
     * @param {Event} e
     */
    function stopDrag(e) {

        doc.off('mousemove', drag);
        doc.off('mouseup', stopDrag);

        var draggable = e.data;

        var bodyClass = draggable.draggingBodyClass;
        if (bodyClass) {
            body.removeClass(bodyClass);
        }

        if (typeof draggable.onDragEnd === 'function') {
            draggable.onDragEnd(draggable.cache.point);
        }
    }

    /**
     * 获得元素的矩形区域
     *
     * @private
     * @param {jQuery} element
     * @return {Object}
     */
    function getRectange(element) {
        var offset = element.offset();
        return {
            left: offset.left,
            top: offset.top,
            right: offset.left + element.prop('scrollWidth'),
            bottom: offset.top + element.prop('scrollHeight')
        };
    }

    /**
     * 把坐标约束在 rect 范围内
     *
     * @private
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
     * @private
     * @param {HTMLElement} target
     * @param {jQuery} container
     * @param {string} selector
     * @return {boolean}
     */
    function inRegion(target, container, selector) {
        var result = false;
        container.find(selector).each(function () {
            if (contains(this, target)) {
                result = true;
                return false;
            }
        });
        return result;
    }

    /**
     * container 是否包含 element
     *
     * @private
     * @param {HTMLElement} container
     * @param {HTMLElement} element
     * @return {boolean}
     */
    function contains(container, element) {
        if (container === element) {
            return true;
        }
        return $.contains(container, element);
    }


    return Draggable;

});
