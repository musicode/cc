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
     * 默认读取元素的 title 属性进行展现，如有特殊需求，可通过 defaultOptions.titleAttr 配置
     *
     * 提示出现的位置可通过 defaultOptions.placement 和 defaultOptions.placementAttr 统一配置
     * 如个别元素需特殊处理，可为元素加上 defaultOptions.placementAttr 配置的属性改写全局配置
     *
     * 如果要实现小箭头效果，可参考如下配置:
     *
     * {
     *    template: '<div class="tooltip"><i class="arrow"></i><div class="content"></div></div>',
     *    update: function () {
     *        this.layer.find('.content').html(
     *            this.element.attr('title')
     *        );
     *    },
     *    placementClass: {
     *        top: 'top'
     *    }
     * }
     *
     * 如需要调整位置，比如不是上下左右，而是下方偏右，可参考如下配置：
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
     * 如果想控制提示浮层的宽度，可以在触发元素上加 data-width="100px"
     *
     */

    'use strict';

    var split = require('../function/split');
    var position = require('../util/position');
    var debounce = require('../function/debounce');
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
     *
     * @property {string=} options.width 提示元素的宽度
     *
     * @property {Function} options.update 更新提示浮层的内容
     * @property {Object=} options.placementClass 方位对应的 className
     * @property {string=} options.placementAttr 优先级比 placement 更高的位置配置
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
                                    element.attr(me.placementAttr) || me.placement
                                );

            var layer = me.layer;
            if (!layer) {

                var template = me.template;

                // 和默认配置的模板相同，可共用一个元素
                // 比如纯展示文本的 tip，完全可以这样实现
                if (template === Tooltip.defaultOptions.template) {
                    layer = layerElement || (layerElement = $(template));
                }
                else {
                    layer = $(template);
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

            var width = element.data('width') || me.width || '';

            me.popup = new Popup({
                element: element,
                layer: layer,
                scope: me,
                show: me.show,
                hide: me.hide,
                onAfterShow: me.onAfterShow,
                onBeforeHide: me.onBeforeHide,
                onAfterHide: function (e) {
                    if (me.resizer) {
                        instance.window.off('resize', me.resizer);
                        me.resizer = null;
                    }
                    if ($.isFunction(me.onAfterHide)) {
                        return me.onAfterHide(e);
                    }
                },
                onBeforeShow: function (e) {

                    me.update();

                    layer.css('max-width', width);

                    if ($.isFunction(me.onBeforeShow)
                        && me.onBeforeShow(e) === false
                    ) {
                        return false;
                    }

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
         * 定位
         *
         * @param {string} placement 方位，可选值有 topLeft     top    topRight
         *                                          left               right
         *                                          bottomLeft bottom  bottomRight
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
                attachment: me.element,
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

            if (me.layer !== layerElement) {
                me.layer.remove();
            }

            me.element =
            me.layer =
            me.popup = null;
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Tooltip.defaultOptions = {
        placement: 'auto',
        template: '<div class="tooltip"></div>',
        placementAttr: 'data-placement',
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

        update: function () {
            this.layer.html(
                this.element.data('title')
            );
        }

    };

    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery} element 需要提示浮层的元素
     * @param {Object=} options 配置参数
     * @return {Array.<Tooltip>}
     */
    Tooltip.init = function (element, options) {

        var result = [ ];

        element.each(function () {
            result.push(
                new Tooltip(
                    $.extend(
                        {
                            element: $(this)
                        },
                        options
                    )
                )
            );
        });

        return result;
    };

    /**
     * 测试左侧
     *
     * @inner
     * @return {boolean}
     */
    function testLeft() {
        return this.element.offset().left > this.layer.outerWidth();
    }

    /**
     * 测试右侧
     *
     * @inner
     * @return {boolean}
     */
    function testRight() {
        var element = this.element;
        return pageWidth() >
               (element.offset().left
               + element.outerWidth()
               + this.layer.outerWidth());
    }

    /**
     * 测试上侧
     *
     * @inner
     * @return {boolean}
     */
    function testTop() {
        return this.element.offset().top > this.layer.outerHeight();
    }

    /**
     * 测试下侧
     *
     * @inner
     * @return {boolean}
     */
    function testBottom() {
        var element = this.element;
        return pageHeight() >
               (element.offset().top
                + element.outerHeight()
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
     * 全局唯一的浮层元素
     *
     * @inner
     * @type {jQuery}
     */
    var layerElement;

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
