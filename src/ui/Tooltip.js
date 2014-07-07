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
     * 默认读取元素的 title 属性进行展现，如有特殊需求，可通过 defaultOptions.attribute.title 配置
     *
     * 提示出现的位置可通过 defaultOptions.placement 和 defaultOptions.attribute.placement 统一配置
     * 如个别元素需特殊处理，可为元素加上 defaultOptions.attribute.placement 配置的属性改写全局配置
     *
     * 如果要实现小箭头效果，可参考如下配置:
     *
     * {
     *    template: '<div class="tooltip"><i class="arrow"></i><div class="content"></div></div>',
     *    className: {
     *        placement: 'tooltip-placement-'
     *    },
     *    onBeforeShow: function () {
     *        this.element.find('.content').html(this.title);
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
     * 如果实例化的 template 参数和 defaultOptions.template 不同，会在实例上新建一个 element 属性
     *
     */

    'use strict';

    var split = require('../function/split');
    var position = require('../util/position');
    var debounce = require('../function/debounce');
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
     * @property {jQuery} options.source 需要工具提示的元素
     * @property {jQuery=} options.element 提示浮层元素，这个配置用于应付比较复杂的场景，如浮层视图里有交互
     *                                     简单场景可用 template 配置搞定
     * @property {string=} options.template 提示元素的模版，可配合使用 className.placement, onBeforeShow 实现特殊需求
     *
     * @property {string=} options.placement 提示元素出现的位置
     *                                       可选值包括 left right top bottom topLeft topRight bottomLeft bottomRight auto
     *                                       可组合使用 如 'bottom,auto'，表示先尝试 bottom，不行就 auto
     *
     * @property {Object=} options.tester 方位检测，非特殊需求可使用默认配置
     * @property {function():boolean=} options.tester.top 检测上侧方位
     * @property {function():boolean=} options.tester.right 检测右侧方位
     * @property {function():boolean=} options.tester.bottom 检测下侧方位
     * @property {function():boolean=} options.tester.left 检测左侧方位
     * @property {function():boolean=} options.tester.topLeft 检测左上侧方位
     * @property {function():boolean=} options.tester.topRight 检测右上侧方位
     * @property {function():boolean=} options.tester.bottomLeft 检测左下侧方位
     * @property {function():boolean=} options.tester.bottomRight 检测右下侧方位
     *
     * @property {Object} options.trigger 触发方式
     * @property {string=} options.trigger.show 显示的触发方式，可选值有 click over focus，可组合使用，以逗号分隔
     * @property {string=} options.trigger.hide 隐藏的触发方式，可选值有 click out blur，可组合使用，以逗号分隔
     *
     * @property {Object=} options.delay 延时
     * @property {number=} options.delay.show 显示延时
     * @property {number=} options.delay.hide 隐藏延时
     *
     * @property {Object=} options.attribute 属性名称
     * @property {string=} options.attribute.title 元素上标注提示内容的属性
     * @property {string=} options.attribute.placement 优先级比 placement 更高的位置配置
     *
     * @property {Object=} options.className 样式
     * @property {string=} options.className.placement 提示方位的 class 前缀，有助于实现小箭头之类的效果
     *
     * @property {Object=} options.animation 动画
     * @property {Function=} options.animation.show 显示动画，如果未设置，默认是 element.show()
     * @property {Function=} options.animation.hide 隐藏动画，如果未设置，默认是 element.hide()
     *
     * @property {Object=} options.gap 提示层和触发元素之间的距离
     * @property {number=} options.gap.x 横向间距，如果为 0，提示会和元素贴在一起
     * @property {number=} options.gap.y 纵向间距，如果为 0，提示会和元素贴在一起
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
        $.extend(this, Tooltip.defaultOptions, options);
        this.init();
    }

    Tooltip.prototype = {

        constructor: Tooltip,

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var cache = me.cache = { };

            var source = me.source;
            var attr = me.attribute;
            var titleAttr = attr.title;

            // 初始化 tip 内容
            me.title = source.attr(titleAttr) || '';

            // 避免出现原生的提示
            if (titleAttr === 'title') {
                source.removeAttr(titleAttr);
            }

            // 优先使用元素属性配置
            var placement = source.attr(attr.placement) || me.placement;
            cache.placements = getPlacementList(placement);

            // 初始化 tip 元素
            var element = me.element;

            if (!element) {

                var template = me.template;

                // 和默认配置的模板相同，可共用一个元素
                // 比如纯展示文本的 tip，完全可以这样实现
                if (template === Tooltip.defaultOptions.template) {
                    element = tipElement || (tipElement = $(template));
                }
                else {
                    element = $(template);
                }

                me.element = element.hide();
            }

            if (!offsetParent(element).is('body')) {
                instance.body.append(element);
            }

            cache.popup = createPopup(me);
        },

        /**
         * 显示提示浮层
         */
        show: function () {
            this.cache.popup.show();
        },

        /**
         * 隐藏提示浮层
         */
        hide: function () {
            this.cache.popup.hide();
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
            var element = me.element;

            // 先设置好样式，再定位
            // 这样才能保证定位计算不会出问题

            var placementClass = element.data(placementClassKey);
            if (placementClass) {
                element.removeClass(placementClass);
                element.removeData(placementClassKey);
            }

            var placementPrefix = me.className.placement;
            if ($.type(placementPrefix) === 'string') {
                placementClass = placementPrefix + placement.toLowerCase();
                element.addClass(placementClass);
                element.data(placementClassKey, placementClass);
            }

            var gap = me.gap;

            // 定位条件
            var options = {
                element: me.element,
                attachment: me.source,
                offsetX: $.isNumeric(gap.x) ? gap.x : 0,
                offsetY: $.isNumeric(gap.y) ? gap.y : 0
            };

            var target = placementMap[ placement ];

            if ($.isFunction(target.gap)) {
                target.gap(options);
            }

            var offset = me.offset[ placement ];
            if (offset) {
                if ($.isNumeric(offset.x)) {
                    options.offsetX += offset.x;
                }
                if ($.isNumeric(offset.y)) {
                    options.offsetY += offset.y;
                }
            }

            position[ target.name ](options);
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            me.cache.popup.dispose();

            if (me.element !== tipElement) {
                me.element.remove();
            }

            me.source =
            me.element =
            me.cache = null;
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

        gap: { },
        delay: { },
        offset: { },
        tester: { },
        trigger: {
            show: 'over',
            hide: 'out,blur'
        },
        attribute: {
            title: 'title',
            placement: 'data-placement'
        },
        className: {
            placement: 'tooltip-placement-'
        }
    };

    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery=} sources 需要提示浮层的元素
     * @param {Object=} options 配置参数
     * @return {Array.<Tooltip>}
     */
    Tooltip.init = function (sources, options) {

        if (sources && !sources.jquery) {
            options = sources;
            sources = null;
        }

        var result = [ ];
        var titleAttr = Tooltip.defaultOptions.attribute.title;

        sources = sources || $('[' + titleAttr + ']');
        sources.each(function () {
            result.push(
                new Tooltip(
                    $.extend(
                        {
                            source: $(this)
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
        return this.source.offset().left > this.element.outerWidth();
    }

    /**
     * 测试右侧
     *
     * @inner
     * @return {boolean}
     */
    function testRight() {
        var source = this.source;
        return pageWidth() >
               (source.offset().left
               + source.outerWidth()
               + this.element.outerWidth());
    }

    /**
     * 测试上侧
     *
     * @inner
     * @return {boolean}
     */
    function testTop() {
        return this.source.offset().top > this.element.outerHeight();
    }

    /**
     * 测试下侧
     *
     * @inner
     * @return {boolean}
     */
    function testBottom() {
        var source = this.source;
        return pageHeight() >
               (source.offset().top
                + source.outerHeight()
                + this.element.outerHeight());
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
            test: testBottom,
            gap: function (options) {
                options.offsetX = 0;
            }
        },

        top: {
            name: 'topCenter',
            test: testTop,
            gap: function (options) {
                options.offsetY *= -1;
                options.offsetX = 0;
            }
        },

        right: {
            name: 'middleRight',
            test: testRight,
            gap: function (options) {
                options.offsetY = 0;
            }
        },

        left: {
            name: 'middleLeft',
            test: testLeft,
            gap: function (options) {
                options.offsetX *= -1;
                options.offsetY = 0;
            }
        },

        bottomLeft: {
            name: 'bottomLeft',
            test: function () {
                return testBottom.call(this)
                    && testLeft.call(this);
            },
            gap: function (options) {
                options.offsetX *= -1;
            }
        },

        bottomRight: {
            name: 'bottomRight',
            test: function () {
                return testBottom.call(this)
                    && testRight.call(this);
            }
        },

        topLeft: {
            name: 'topLeft',
            test: function () {
                return testTop.call(this)
                    && testLeft.call(this);
            },
            gap: function (options) {
                options.offsetX *= -1;
                options.offsetY *= -1;
            }
        },

        topRight: {
            name: 'topRight',
            test: function () {
                return testTop.call(this)
                    && testRight.call(this);
            },
            gap: function (options) {
                options.offsetY *= -1;
            }
        }
    };


    /**
     * 全局唯一的 tip 元素
     *
     * @inner
     * @type {jQuery}
     */
    var tipElement;

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
                if (placementMap[ name ]) {
                    result.push(name);
                }
                else {
                    for (var name in placementMap) {
                        if (placementMap.hasOwnProperty(name)
                            && $.inArray(name, result) < 0
                        ) {
                            result.push(name);
                        }
                    }
                    return false;
                }
            }
        );

        return result;

    }

    /**
     * 创建 Popup 实例
     *
     * @inner
     * @param {Tooltip} tooltip
     * @return {Popup}
     */
    function createPopup(tooltip) {

        var cache = tooltip.cache;

        return new Popup({
            source: tooltip.source,
            element: tooltip.element,
            scope: tooltip,
            trigger: tooltip.trigger,
            delay: tooltip.delay,
            animation: tooltip.animation,
            onAfterShow: tooltip.onAfterShow,
            onBeforeHide: tooltip.onBeforeHide,
            onAfterHide: function (e) {
                if (cache.resizer) {
                    instance.window.off('resize', cache.resizer);
                    cache.resizer = null;
                }
                if ($.isFunction(tooltip.onAfterHide)) {
                    return tooltip.onAfterHide(e);
                }
            },
            onBeforeShow: function (e) {

                var placements = cache.placements;
                var placement = placements.length === 1 && placements[0];
                var result;

                if ($.isFunction(tooltip.onBeforeShow)) {
                    result = tooltip.onBeforeShow(e);
                }

                if (result !== false && !placement) {
                    $.each(
                        placements,
                        function (index, name) {
                            var test = tooltip.tester[ name ] || placementMap[ name ].test;
                            if (test.call(tooltip)) {
                                placement = name;
                                return false;
                            }
                        }
                    );
                }

                if (result === false || !placement) {
                    return false;
                }

                tooltip.pin(placement);

                instance.window.resize(
                    cache.resizer =
                    debounce(
                        function () {
                            tooltip.pin(placement);
                        },
                        50
                    )
                );
            }
        });
    }


    return Tooltip;

});
