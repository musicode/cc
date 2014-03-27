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
     * @param {jQuery} options.element 需要拖拽的元素
     * @param {jQuery=} options.container 限制拖拽范围的容器，默认是 body
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
            var container = this.container;
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

            this.cache = {
                isChild: isChild,
                position: position,
                point: {
                    left: typeof x === 'string' ? parseInt(x, 10) : x,
                    top: typeof y === 'string' ? parseInt(y, 10) : y
                }
            };

            element.css(style);
            element.on('mousedown', this, onDragStart);
        },

        /**
         * 销毁对象
         */
        dispose: function () {
            var element = this.element;
            var cache = this.cache;

            if (cache.onDragEnd) {
                cache.onDragEnd();
            }
            element.off('mousedown', onDragStart);
            element.css('position', cache.position);

            this.cache =
            this.element =
            this.container = null;
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
        container: doc.prop('scrollHeight') > body.prop('scrollHeight')
                 ? doc
                 : body
    };

    /**
     * mousedown 触发拖拽
     *
     * @private
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


        // ==============================================================
        // 计算坐标
        // ==============================================================
        var containerRect = getRectange(draggable.container);
        var targetRect = getRectange(element);

        var pageX = e.pageX;
        var pageY = e.pageY;

        var containerX = containerRect.left;
        var containerY = containerRect.top;
        var targetX = targetRect.left;
        var targetY = targetRect.top;

        // 偏移量坐标
        var offsetX = pageX - targetX;
        var offsetY = pageY - targetY;

        var isChild =  cache.isChild;
        if (isChild) {
            offsetX += containerX;
            offsetY += containerY;
        }

        // 开始点坐标
        var point = cache.point;

        cache.originX = point.left;
        cache.originY = point.top;
        cache.offsetX = offsetX;
        cache.offsetY = offsetY;

        // 可移动的范围
        var left = isChild ? 0 : containerX;
        var top = isChild ? 0 : containerY;

        cache.movableRect = {
            left: left,
            top: top,
            right: left + (containerRect.right - containerX) - (targetRect.right - targetX),
            bottom: top + (containerRect.bottom - containerY) - (targetRect.bottom - targetY)
        };

        // 避免出现选区
        disableSelection(cache);

        doc.on('mousemove', (cache.onDrag = onDrag(draggable)));
        doc.on('mouseup', (cache.onDragEnd = onDragEnd(draggable)));

        if (typeof draggable.onDragStart === 'function') {
            draggable.onDragStart(point);
        }
    }


    /**
     * 正在拖拽
     *
     * @private
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
     * @private
     * @param {Draggable} draggable
     */
    function onDragEnd(draggable) {

        return function () {

            var cache = draggable.cache;
            doc.off('mousemove', cache.onDrag);
            doc.off('mouseup', cache.onDragEnd);

            cache.onDrag = cache.onDragEnd = null;

            enableSelection(cache);

            if (typeof draggable.onDragEnd === 'function') {
                draggable.onDragEnd(cache.point);
            }
        };
    }

    /**
     * 是否支持 onselectstart 禁用选区
     *
     * @private
     * @return {boolean}
     */
    var supportSelectStart = typeof doc[0].onselectstart !== 'undefined';

    /**
     * 禁掉拖动时产生的选区
     *
     * @private
     * @param {Object} cache
     */
    var disableSelection;

    /**
     * 选区恢复原状
     *
     * @private
     * @param {Object} cache
     */
    var enableSelection;

    if (supportSelectStart) {
        disableSelection = function (cache) {
            var target = doc[0];
            cache.selectStart = target.onselectstart;;
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
            right: offset.left + element.prop('offsetWidth'),
            bottom: offset.top + element.prop('offsetHeight')
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
     * 是否是非 static 父元素
     *
     * @private
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
        while (childElement[0])
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
