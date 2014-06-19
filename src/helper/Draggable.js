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

    /**
     * 拖拽
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 需要拖拽的元素
     * @property {jQuery=} options.container 限制拖拽范围的容器，默认是 body
     * @property {string=} options.handle 触发拖拽的区域 (css 选择器)
     * @property {string=} options.cancel 不触发拖拽的区域 (css 选择器)
     * @property {string=} options.axis 限制方向，可选值包括 'x' 'y'
     * @property {boolean=} options.silence 是否不产生位移，仅把当前坐标通过事件传出去
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

            // 实际定位的容器
            // 即离 element 最近的非 static 父元素
            var realContainer = isChild ? container : body;

            // 不满足这个条件就不要玩了...
            if (!isUnstaticParent(realContainer, element)) {
                throw new Error('[Draggable] options.element\'s closest unstatic parent element is wrong.');
            }

            var style = { };

            // 避免调用时忘了设置 position
            var position = element.css('position');
            if (position === 'static') {
                style.position = 'absolute';
            }

            // 确定初始坐标
            var x = element.css('left');
            var y = element.css('top');

            // 初始化元素起始坐标
            // 如果坐标值是 auto，第一次拖动可能会闪跳一次
            var isAutoX = x === 'auto';
            var isAutoY = y === 'auto';

            if (isAutoX || isAutoY) {
                var containerOffset = realContainer.offset();
                var targetOffset = element.offset();

                if (isAutoX) {
                    x = style.left = targetOffset.left - containerOffset.left;
                }
                if (isAutoY) {
                    y = style.top = targetOffset.top - containerOffset.top;
                }
            }

            me.cache = {
                isChild: isChild,
                position: position,
                point: {
                    left: typeof x === 'string' ? parseInt(x, 10) : x,
                    top: typeof y === 'string' ? parseInt(y, 10) : y
                }
            };

            element.css(style);
            element.on('mousedown', me, onDragStart);
        },

        /**
         * 获得可移动范围的矩形信息
         *
         * @return {Object}
         */
        getRectange: function () {
            return getMovableRectange(this);
        },

        /**
         * 销毁对象
         */
        dispose: function () {
            var me = this;

            var element = me.element;
            var cache = me.cache;

            if (cache.onDragEnd) {
                cache.onDragEnd();
            }
            element.off('mousedown', onDragStart);
            element.css('position', cache.position);

            me.cache =
            me.element =
            me.container = null;
        }
    };

    /**
     * document 元素
     *
     * @inner
     * @type {jQuery}
     */
    var doc = $(document.documentElement);

    /**
     * body 元素
     *
     * @inner
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
        container: doc.prop('scrollHeight') > body.prop('scrollHeight')
                 ? doc
                 : body
    };

    /**
     * 获得可拖拽的矩形范围
     *
     * @inner
     * @param {Draggable} draggable
     * @param {Object=} containerRect
     * @param {Object=} targetRect
     * @return {Object}
     */
    function getMovableRectange(draggable, containerOffset, elementOffset) {

        var container = draggable.container;
        var element = draggable.element;

        containerOffset = containerOffset
                       || container.offset();

        elementOffset = elementOffset
                     || element.offset();

        var isChild = draggable.cache.isChild;
        var borderLeftWidth = parseInt(container.css('border-left-width'), 10);
        var borderTopWidth = parseInt(container.css('border-top-width'), 10);

        var left = isChild
                 ? 0
                 : (containerOffset.left + borderLeftWidth || 0);

        var top = isChild
                ? 0
                : (containerOffset.top + borderTopWidth || 0);

        var width = container.innerWidth() - element.outerWidth();
        var height = container.innerHeight() - element.outerHeight();

        return {

            left: left,
            top: top,
            right: left + width,
            bottom: top + height,

            width: width,
            height: height
        };
    }

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

        cache.originX = point.left;
        cache.originY = point.top;
        cache.offsetX = offsetX;
        cache.offsetY = offsetY;
        cache.dragging = false;

        cache.movableRect = getMovableRectange(draggable, containerOffset, targetOffset);

        // 避免出现选区
        disableSelection(cache);

        doc.on('mousemove', cache.onDrag = onDrag(draggable));
        doc.on('mouseup', cache.onDragEnd = onDragEnd(draggable));

        if (typeof draggable.onDragStart === 'function') {
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
                left: axis === 'y' ? cache.originX : (e.pageX - cache.offsetX),
                top: axis === 'x' ? cache.originY : (e.pageY - cache.offsetY)
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

            if (typeof draggable.onDrag === 'function') {
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

            doc.off('mousemove', cache.onDrag)
               .off('mouseup', cache.onDragEnd);

            cache.onDrag =
            cache.onDragEnd = null;

            enableSelection(cache);

            if (cache.dragging) {
                if (typeof draggable.onDragEnd === 'function') {
                    draggable.onDragEnd(cache.point);
                }
            }
        };
    }

    /**
     * 是否支持 onselectstart 禁用选区
     *
     * @inner
     * @type {boolean}
     */
    var supportSelectStart = typeof doc[0].onselectstart !== 'undefined';

    /**
     * 禁掉拖动时产生的选区
     *
     * @inner
     * @param {Object} cache
     */
    var disableSelection;

    /**
     * 选区恢复原状
     *
     * @inner
     * @param {Object} cache
     */
    var enableSelection;

    if (supportSelectStart) {
        disableSelection = function (cache) {
            var target = doc[0];
            cache.selectStart = target.onselectstart;
            target.onselectstart = function () {
                return false;
            };
        };
        enableSelection = function (cache) {
            doc[0].onselectstart = cache.selectStart;
        };
    }
    else {
        disableSelection = function (cache) {
            cache.userSelect = doc.css('MozUserSelect');
            doc.css('MozUserSelect', 'none');
        };
        enableSelection = function (cache) {
            doc.css('MozUserSelect', cache.userSelect);
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
     * 是否是非 static 父元素
     *
     * @inner
     * @param {jQuery} parentElement
     * @param {jQuery} childElement
     * @return {boolean}
     */
    function isUnstaticParent(parentElement, childElement) {
        do {
            childElement = childElement.parent();

            if (childElement[0] === parentElement[0]) {
                return true;
            }

            if (childElement.css('position') !== 'static') {
                return false;
            }
        }
        while (childElement[0]);
    }

    /**
     * container 是否包含 element
     *
     * @inner
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
