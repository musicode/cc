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

    var page = require('../function/page');
    var restrain = require('../function/restrain');
    var position = require('../function/position');
    var contains = require('../function/contains');
    var offsetParent = require('../function/offsetParent');
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
     * @property {string=} options.axis 限制方向，可选值包括 'x' 'y'
     * @property {boolean=} options.silence 是否不产生位移，仅把当前坐标通过事件传出去
     *
     * @property {Object} options.selector 选择器
     * @property {string=} options.selector.handle 触发拖拽的区域
     * @property {string=} options.selector.cancel 不触发拖拽的区域
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
                throw new Error('[Draggable] options.element\'s closest offset element is wrong.');
            }

            var style = position(element);

            var cache = me.cache
                      = {
                            isChild: isChild
                        };

            var fixed = style.position === 'fixed';
            cache.xName = fixed ? 'clientX' : 'pageX';
            cache.yName = fixed ? 'clientY' : 'pageY';

            var args = [ 'mousedown' + namespace, me, onDragStart ];

            // 用选择器实现 handle
            // 不知道为啥 :not() 选择器不能实现 cancel
            var handle = me.selector.handle;
            if (handle) {
                args.splice(1, 0, handle);
            }

            element.css(style);
            element.on.apply(element, args);
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

            me.element.off(namespace);

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

            var result = {
                x: 0,
                y: 0,
                width: container.innerWidth(),
                height: container.innerHeight()
            };

            if (!me.cache.isChild) {

                var containerOffset = container.offset();
                var borderLeftWidth = parseInt(container.css('border-left-width'), 10) || 0;
                var borderTopWidth = parseInt(container.css('border-top-width'), 10) || 0;

                result.x = containerOffset.left + borderLeftWidth;
                result.y = containerOffset.top + borderTopWidth;
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

    /**
     * mousedown 触发拖拽
     *
     * @inner
     * @param {Event} e
     */
    function onDragStart(e) {

        var draggable = e.data;
        var target = e.target;
        var element = draggable.element;

        var cancel = draggable.selector.cancel;
        if (cancel) {
            element.find(cancel).each(
                function () {
                    cancel = contains(this, target);
                    if (cancel) {
                        return false;
                    }
                }
            );
            if (cancel) {
                return;
            }
        }

        var cache = draggable.cache;

        // 开始点坐标
        var point = position(element);
        delete point.position;

        cache.point = point;

        // 计算偏移量坐标
        var offset = element.offset();

        // offset() 是基于页面大小来计算的
        // 所以这里要用 pageX/Y
        var offsetX = e.pageX - offset.left;
        var offsetY = e.pageY - offset.top;

        if (cache.isChild) {
            var containerOffset = draggable.container.offset();
            offsetX += containerOffset.left;
            offsetY += containerOffset.top;
        }

        cache.offsetX = offsetX + parseInt(element.css('margin-left'), 10) || 0;
        cache.offsetY = offsetY + parseInt(element.css('margin-top'), 10) || 0;

        // 可移动的矩形范围
        var rect = draggable.getRectange(true);
        cache.minX = rect.x;
        cache.minY = rect.y;
        cache.maxX = rect.x + rect.width;
        cache.maxY = rect.y + rect.height;

        cache.counter = 0;

        disableSelection();

        instance.document
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

        var draggable = e.data;
        var cache = draggable.cache;
        var point = cache.point;
        var axis = draggable.axis;

        var x = axis === 'y'
              ? point.left
              : e[ cache.xName ] - cache.offsetX;

        var y = axis === 'x'
              ? point.top
              : e[ cache.yName ] - cache.offsetY;

        // 纠正范围
        x = restrain(x, cache.minX, cache.maxX);
        y = restrain(y, cache.minY, cache.maxY);

        if (point.left === x
            && point.top === y
        ) {
            return;
        }

        point.left = x;
        point.top = y;

        if (++cache.counter === 1
            && $.isFunction(draggable.onDragStart)
        ) {
            draggable.onDragStart(point);
        }

        if (!draggable.silence) {
            draggable.element.css(point);
        }

        if ($.isFunction(draggable.onDrag)) {
            draggable.onDrag(point);
        }
    }

    /**
     * 停止拖拽
     *
     * @inner
     * @param {Event} e
     */
    function onDragEnd(e) {

        enableSelection();

        instance.document
                .off('mousemove' + namespace)
                .off('mouseup' + namespace);

        var draggable = e.data;
        var cache = draggable.cache;

        if (cache.counter > 0) {
            if ($.isFunction(draggable.onDragEnd)) {
                draggable.onDragEnd(cache.point);
            }
        }
    }


    return Draggable;

});
