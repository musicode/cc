/**
 * @file Tooltip
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * 鼠标悬浮元素，弹出提示浮层
     *
     * 鉴于需求较多，可通过 Tooltip.defaultOptions 进行配置
     *
     * 提示出现的位置可通过 defaultOptions.placement 统一配置
     * 如个别元素需特殊处理，可为元素加上 data-placement 属性改写全局配置
     *
     * 如全局希望浮层显示在触发元素下方，可配置 Tooltip.defaultOptions.placement = 'bottom';
     *
     * 但是有个别元素，显示在下方体验不好，可在模板里写 <span data-placement="top">xx</span>
     *
     * 如果要实现箭头效果，有两种方式：
     *
     * 1. border 实现: 配置 defaultOptions.placementClass，这是一个方位映射表，如
     *
     *    {
     *        top: 'tooltip-up',
     *        bottom: 'tooltip-down'
     *    }
     *
     *    当显示在上方时，会给浮层元素加上 `tooltip-up` class;
     *    当显示在下方时，会给浮层元素加上 `tooltip-down` class;
     *
     *    接下来可用 border 实现三角形，但需注意的是，
     *    当箭头向上时，需要把 border-top-width 设置为 0，
     *    这样才可避免透明的上边框影响触发逻辑，其他方向同理
     *
     * 2. 图标实现：配置 defaultOptions.updatePlacement 函数，如：
     *
     *    function (placement) {
     *
     *        var map = {
     *            top: 'up',
     *            right: 'right',
     *            bottom: 'down',
     *            left: 'left'
     *        };
     *
     *        var icon = 'icon icon-angle-' + map[placement];
     *
     *        this.layer.find('.icon').prop('class', icon);
     *
     *    };
     *
     *
     * 如需要微调位置，比如不是上下左右，而是下方偏右，可参考如下配置：
     *
     * {
     *     placement: 'bottom,auto',
     *     offset: {
     *         bottom: {
     *             x: 20,   // 向右偏移 20px
     *             y: 0
     *         }
     *     }
     * }
     *
     * 如果实例化的 template 参数和 defaultOptions.template 不同，会在实例上新建一个 layer 属性
     *
     * 如果想控制提示浮层的最大宽度，可以在触发元素上加 data-width="100px"
     *
     */

    /**
     * @update
     *
     * 1. 鉴于全局元素比较多，而且通常有动态创建的元素的场景，因此改成事件代理
     *
     * 2. 为了减少元素数量，同一个模板改为元素共享
     */

    'use strict';

    var init = require('../function/init');
    var split = require('../function/split');
    var position = require('../util/position');
    var debounce = require('../function/debounce');
    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var pageWidth = require('../function/pageWidth');
    var pageHeight = require('../function/pageHeight');
    var offsetParent = require('../function/offsetParent');

    var Popup = require('../helper/Popup');
    var instance = require('../util/instance');

    /**
     * 工具提示
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 需要工具提示的元素
     * @property {jQuery=} options.layer 提示浮层元素，这个配置用于应付比较复杂的场景，如浮层视图里有交互
     *                                   简单场景可用 template 配置搞定
     * @property {string=} options.template 提示元素的模版，可配合使用 placementClass, onBeforeShow 实现特殊需求
     *
     * @property {string=} options.placement 提示元素出现的位置
     *                                       可选值包括 left right top bottom topLeft topRight bottomLeft bottomRight auto
     *                                       可组合使用 如 'bottom,auto'，表示先尝试 bottom，不行就 auto
     * @property {string=} options.selector 如果传了选择器，表示为 element 的 selector 元素进行事件代理
     * @property {string=} options.width 提示元素的宽度
     *
     * @property {Function} options.updateContent 更新提示浮层的内容
     * @property {Function} options.updatePlacement 更新提示浮层的方位
     * @property {Object=} options.placementClass 方位对应的 className
     *
     * @property {Object} options.show
     * @property {string=} options.show.trigger 显示的触发方式，可选值有 click over focus，可组合使用，以逗号分隔
     * @property {number=} options.show.delay 显示延时
     * @property {Function=} options.show.animation 显示动画，如果未设置，默认是 layer.show()
     *
     * @property {Object} options.hide
     * @property {string=} options.hide.trigger 隐藏的触发方式，可选值有 click out blur，可组合使用，以逗号分隔
     * @property {number=} options.hide.delay 隐藏延时
     * @property {Function=} options.hide.animation 隐藏动画，如果未设置，默认是 layer.hide()
     *
     * @property {Object} options.gap
     * @property {number=} options.gap.x 提示层和触发元素之间的横向间距，如果为 0，提示会和元素贴在一起
     * @property {number=} options.gap.y 提示层和触发元素之间的纵向间距，如果为 0，提示会和元素贴在一起
     *
     * @property {Object=} options.offset 偏移量
     * @property {Object=} options.offset.top 设置上侧偏移量
     * @property {Object=} options.offset.right 设置右侧偏移量
     * @property {Object=} options.offset.bottom 设置下侧偏移量
     * @property {Object=} options.offset.left 设置左侧偏移量
     * @property {Object=} options.offset.topLeft 设置左上侧偏移量
     * @property {Object=} options.offset.topRight 设置右上侧偏移量
     * @property {Object=} options.offset.bottomLeft 设置左下侧偏移量
     * @property {Object=} options.offset.bottomRight 设置右下侧偏移量
     *
     * @property {Function=} options.onBeforeShow 返回 false 可阻止 tip 显示
     * @property {Function=} options.onAfterShow
     * @property {Function=} options.onBeforeHide 返回 false 可阻止 tip 隐藏
     * @property {Function=} options.onAfterHide
     */
    function Tooltip(options) {
        return lifeCycle.init(this, options);
    }

    Tooltip.prototype = {

        constructor: Tooltip,

        type: 'Tooltip',

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;

            var placementList = getPlacementList(
                                    element.data('placement') || me.placement
                                );

            var layer = me.layer;
            if (!layer) {

                var template = me.template;

                layer = templateElementMap[ template ];

                if (!layer) {
                    layer = templateElementMap[ template ] = $(template);
                }

                me.layer = layer;

            }

            layer.hide();

            if (!offsetParent(layer).is('body')) {
                instance.body.append(layer);
            }

            var show = me.show;
            var hide = me.hide;

            if (!show.trigger) {
                show.trigger = 'over';
            }
            if (!hide.trigger) {
                hide.trigger = 'out,click';
            }

            var animation = show.animation;
            if ($.isFunction(animation)) {
                show.animation = $.proxy(animation, me);
            }

            animation = hide.animation;
            if ($.isFunction(animation)) {
                hide.animation = $.proxy(animation, me);
            }

            var width = element.data('width') || me.width || '';

            me.popup = new Popup({
                element: element,
                layer: layer,
                selector: me.selector,
                show: show,
                hide: hide,
                onAfterShow: function (e) {
                    me.emit(e);
                },
                onBeforeHide: function (e) {
                    me.emit(e);
                },
                onAfterHide: function (e) {

                    if (me.resizer) {
                        instance.window.off('resize', me.resizer);
                        me.resizer = null;
                    }

                    me.emit(e);
                },
                onBeforeShow: function (e) {

                    var skinClass;
                    var sourceElement = me.sourceElement;

                    if (sourceElement) {
                        skinClass = sourceElement.data('skin');
                    }

                    sourceElement =
                    me.sourceElement = $(e.currentTarget);

                    var placement = placementList.length === 1
                                 && placementList[0];

                    if (!placement) {
                        $.each(
                            placementList,
                            function (index, name) {
                                var tests = placementMap[name].test;
                                for (var i = 0, len = tests.length; i < len; i++) {
                                    if (!tests[i].call(me)) {
                                        return;
                                    }
                                }
                                placement = name;
                                return false;
                            }
                        );

                        if (!placement) {
                            return false;
                        }
                    }

                    if (skinClass) {
                        layer.removeClass(skinClass);
                    }

                    var skinClass = sourceElement.data('skin');
                    if (skinClass) {
                        layer.addClass(skinClass);
                    }

                    me.updateContent();
                    me.updatePlacement(placement);

                    if (width) {
                        layer.css('max-width', width);
                    }

                    me.emit(e);

                    if (e.isDefaultPrevented()) {
                        return false;
                    }

                    me.pin(placement);

                    instance.window.resize(
                        me.resizer =
                        debounce(
                            function () {
                                if (me.popup) {
                                    me.pin(placement);
                                }
                            },
                            50
                        )
                    );
                }
            });
        },

        /**
         * 显示提示浮层
         */
        open: function () {
            this.popup.open();
        },

        /**
         * 隐藏提示浮层
         */
        close: function () {
            this.popup.close();
        },

        /**
         * 获得触发源元素
         *
         * @return {jQuery}
         */
        getSourceElement: function () {
            return this.sourceElement;
        },

        /**
         * 定位
         *
         * @param {string} placement 方位，可选值有 topLeft     top    topRight
         *                                        left               right
         *                                        bottomLeft bottom  bottomRight
         *
         */
        pin: function (placement) {

            var me = this;
            var layer = me.layer;

            // 先设置好样式，再定位
            // 这样才能保证定位计算不会出问题

            var placementClass = layer.data(placementClassKey);
            if (placementClass) {
                layer.removeClass(placementClass);
                layer.removeData(placementClassKey);
            }

            placementClass = me.placementClass;
            if (placementClass
                && (placementClass = placementClass[placement])
            ) {
                layer.addClass(placementClass);
                layer.data(placementClassKey, placementClass);
            }

            // 定位条件
            var gap = me.gap;
            var options = {
                element: me.layer,
                attachment: me.sourceElement,
                offsetX: $.type(gap.x) === 'number' ? gap.x : 0,
                offsetY: $.type(gap.y) === 'number' ? gap.y : 0
            };

            var target = placementMap[placement];

            if ($.isFunction(target.gap)) {
                target.gap(options);
            }

            var offset = me.offset[placement];
            if (offset) {
                if ($.type(offset.x) === 'number') {
                    options.offsetX += offset.x;
                }
                if ($.type(offset.y) === 'number') {
                    options.offsetY += offset.y;
                }
            }

            position[target.name](options);
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.popup.dispose();

            me.element =
            me.sourceElement =
            me.layer =
            me.popup = null;
        }
    };

    jquerify(Tooltip.prototype);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Tooltip.defaultOptions = {
        placement: 'auto',
        template: '<div class="tooltip tooltip-inverted"></div>',
        placementClass: {
            top: 'tooltip-top',
            right: 'tooltip-right',
            bottom: 'tooltip-bottom',
            left: 'tooltip-left',
            topLeft: 'tooltip-top-left',
            topRight: 'tooltip-top-right',
            bottomLeft: 'tooltip-bottom-left',
            bottomRight: 'tooltip-bottom-right'
        },

        show: {
            trigger: 'over',
            delay: 100
        },
        hide: {
            trigger: 'out',
            delay: 100
        },
        gap: { x: 10, y: 10 },
        offset: { },

        updateContent: function () {

            var layer = this.layer;

            layer.html(
                this.getSourceElement().data('title')
            );

        },

        updatePlacement: $.noop

    };

    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery} element 需要提示浮层的元素
     * @param {Object=} options 配置参数
     * @return {Array.<Tooltip>}
     */
    Tooltip.init = init(Tooltip);

    /**
     * 测试左侧
     *
     * @inner
     * @return {boolean}
     */
    function testLeft() {
        return this.sourceElement.offset().left > this.layer.outerWidth();
    }

    /**
     * 测试右侧
     *
     * @inner
     * @return {boolean}
     */
    function testRight() {
        var sourceElement = this.sourceElement;
        return pageWidth() >
               (sourceElement.offset().left
               + sourceElement.outerWidth()
               + this.layer.outerWidth());
    }

    /**
     * 测试上侧
     *
     * @inner
     * @return {boolean}
     */
    function testTop() {
        return this.sourceElement.offset().top > this.layer.outerHeight();
    }

    /**
     * 测试下侧
     *
     * @inner
     * @return {boolean}
     */
    function testBottom() {
        var sourceElement = this.sourceElement;
        return pageHeight() >
               (sourceElement.offset().top
                + sourceElement.outerHeight()
                + this.layer.outerHeight());
    }

    /**
     * 方位映射表
     *
     * @inner
     * @type {Object}
     */
    var placementMap = {

        bottom: {
            name: 'bottomCenter',
            test: [testBottom],
            gap: function (options) {
                options.offsetX = 0;
            }
        },

        top: {
            name: 'topCenter',
            test: [testTop],
            gap: function (options) {
                options.offsetY *= -1;
                options.offsetX = 0;
            }
        },

        right: {
            name: 'middleRight',
            test: [testRight],
            gap: function (options) {
                options.offsetY = 0;
            }
        },

        left: {
            name: 'middleLeft',
            test: [testLeft],
            gap: function (options) {
                options.offsetX *= -1;
                options.offsetY = 0;
            }
        },

        bottomLeft: {
            name: 'bottomLeft',
            test: [testBottom, testLeft],
            gap: function (options) {
                options.offsetX *= -1;
            }
        },

        bottomRight: {
            name: 'bottomRight',
            test: [testBottom, testRight]
        },

        topLeft: {
            name: 'topLeft',
            test: [testTop, testLeft],
            gap: function (options) {
                options.offsetX *= -1;
                options.offsetY *= -1;
            }
        },

        topRight: {
            name: 'topRight',
            test: [testTop, testRight],
            gap: function (options) {
                options.offsetY *= -1;
            }
        }
    };

    /**
     * 每个模板对应一个元素，这样可以少创建很多元素
     *
     * @inner
     * @type {Object}
     */
    var templateElementMap = { };

    /**
     * 存储当前方位 className 的 key
     *
     * @inner
     * @type {string}
     */
    var placementClassKey = '__placement__';

    /**
     * 获取方位的遍历列表
     *
     * placement 可能包含 auto
     * 解析方法是把 auto 之前的方位依次放入结果，再把 auto 转成剩余的方位
     *
     * @param {string} placement
     * @return {Array.<string>}
     */
    function getPlacementList(placement) {

        var result = [ ];

        $.each(
            split(placement, ','),
            function (index, name) {
                if (placementMap[name]) {
                    result.push(name);
                }
                else {
                    // 没匹配到的唯一情况是 auto
                    $.each(
                        placementMap,
                        function (name, value) {
                            if ($.inArray(name, result) < 0) {
                                result.push(name);
                            }
                        }
                    );
                    return false;
                }
            }
        );

        return result;
    }


    return Tooltip;

});
