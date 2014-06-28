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
     *    placementPrefix: 'tooltip-placement-',
     *    update: function (tipElement) {
     *        tipElement.find('.content').html(this.title);
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

    var Popup = require('../helper/Popup');
    var position = require('../util/position');
    var instance = require('../util/instance');
    var debounce = require('../function/debounce');
    var offsetParent = require('../function/offsetParent');
    var pageWidth = require('../function/pageWidth');
    var pageHeight = require('../function/pageHeight');

    /**
     * 工具提示
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.source 需要工具提示的元素
     * @property {jQuery=} options.element 提示浮层元素，这个配置用于应付比较复杂的场景，如浮层视图里有交互，简单场景可用 template 配置搞定
     *
     * @property {string=} options.placement 提示元素出现的位置，可选值包括 left right top bottom topLeft topRight bottomLeft bottomRight auto，可组合使用 如 'bottom,auto'，表示先尝试 bottom，不行就 auto
     * @property {string=} options.placementAttr 优先级比 placement 更高的位置配置
     * @property {string=} options.placementPrefix 提示方位的 class 前缀，有助于实现小箭头之类的效果
     *
     * @property {Object} options.trigger 触发方式
     * @property {string=} options.trigger.show 显示的触发方式，可选值有 click over focus，可组合使用，以逗号分隔
     * @property {string=} options.trigger.hide 隐藏的触发方式，可选值有 blur out，可组合使用，以逗号分隔
     *
     * @property {Object=} options.delay 延时
     * @property {number=} options.delay.show 显示延时
     * @property {number=} options.delay.hide 隐藏延时
     *
     * @property {Object=} options.animation 动画
     * @property {Function=} options.animation.show 显示动画，如果未设置，默认是 element.show()
     * @property {Function=} options.animation.hide 隐藏动画，如果未设置，默认是 element.hide()
     *
     * @property {Object=} options.gap 提示层和触发元素之间的距离
     * @property {number=} options.gap.x 横向间距，如果为 0，提示会和元素贴在一起
     * @property {number=} options.gap.y 纵向间距，如果为 0，提示会和元素贴在一起
     *
     * @property {Object=} options.offset 设置 left right top bottom topLeft topRight bottomLeft bottomRight 方向的偏移量
     *
     * @property {string=} options.template 提示元素的模版，可配合使用 placementPrefix, update 实现特殊需求
     * @property {Function} options.update 更新 tip 元素的内容
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

            var source = me.source;
            var titleAttr = me.titleAttr;

            // 初始化 tip 内容
            me.title = source.attr(titleAttr);
            me.placement = source.attr(me.placementAttr) || me.placement;

            // 避免出现原生的提示
            if (titleAttr === 'title') {
                source.removeAttr(titleAttr);
            }

            // 初始化 tip 元素
            var element = me.element;

            if (!element) {

                var template = me.template;

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

            me.cache = {
                popup: createPopup(me)
            };
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

        titleAttr: 'title',

        placement: 'bottom,auto',
        placementAttr: 'data-placement',
        placementPrefix: 'tooltip-placement-',

        gap: { },
        delay: { },
        offset: { },
        trigger: {
            show: 'over',
            hide: 'out,blur'
        },

        update: $.noop,
        template: '<div class="tooltip"></div>'
    };

    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery=} triggers 需要提示浮层的元素
     * @param {Object=} options 配置参数
     * @return {Array.<Tooltip>}
     */
    Tooltip.init = function (triggers, options) {

        if (!options && $.isPlainObject(triggers)) {
            options = triggers;
            triggers = null;
        }

        triggers = triggers || $('[' + Tooltip.defaultOptions.titleAttr + ']');

        var result = [ ];

        triggers.each(function () {
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
     * 方位映射表
     *
     * @inner
     * @type {Object}
     */
    var placementMap = {

        bottom: {
            name: 'bottomCenter',
            check: function (options) {
                return options.bottom > 0
                    && options.left > 0
                    && options.right > 0;
            },
            gap: function (options) {
                options.offsetX = 0;
            }
        },

        top: {
            name: 'topCenter',
            check: function (options) {
                return options.top > 0
                    && options.left > 0
                    && options.right > 0;
            },
            gap: function (options) {
                options.offsetY *= -1;
                options.offsetX = 0;
            }
        },

        right: {
            name: 'middleRight',
            check: function (options) {
                return options.right > 0;
            },
            gap: function (options) {
                options.offsetY = 0;
            }
        },

        left: {
            name: 'middleLeft',
            check: function (options) {
                return options.left > 0;
            },
            gap: function (options) {
                options.offsetX *= -1;
                options.offsetY = 0;
            }
        },

        bottomLeft: {
            name: 'bottomLeft',
            check: function (options) {
                return options.left > 0
                    && options.bottom > 0;
            },
            gap: function (options) {
                options.offsetX *= -1;
            }
        },

        bottomRight: {
            name: 'bottomRight',
            check: function (options) {
                return options.right > 0
                    && options.bottom > 0;
            }
        },

        topLeft: {
            name: 'topLeft',
            check: function (options) {
                return options.left > 0
                    && options.top > 0;
            },
            gap: function (options) {
                options.offsetX *= -1;
                options.offsetY *= -1;
            }
        },

        topRight: {
            name: 'topRight',
            check: function (options) {
                return options.right > 0
                    && options.top > 0;
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
     * 更新 element 的方位 className
     *
     * @inner
     * @param {Tooltip} tooltip 实例
     * @param {string} placement 方位
     */
    function updatePlacementClass(tooltip, placement) {

        var element = tooltip.element;
        var placementClass = element.data(placementClassKey);

        if (placementClass) {
            element.removeClass(placementClass);
            element.removeData(placementClassKey);
        }

        var placementPrefix = tooltip.placementPrefix;
        if ($.type(placementPrefix) === 'string') {
            placementClass = placementPrefix + placement.toLowerCase();
            element.addClass(placementClass);
            element.data(placementClassKey, placementClass);
        }
    }

    /**
     * 创建 Popup 实例
     *
     * @inner
     * @param {Tooltip} tooltip
     * @return {Popup}
     */
    function createPopup(tooltip) {
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

                var cache = tooltip.cache;

                if (cache.resizer) {
                    instance.window.off('resize', cache.resizer);
                    cache.resizer = null;
                }

                if ($.isFunction(tooltip.onAfterHide)) {
                    return tooltip.onAfterHide(e);
                }

            },
            onBeforeShow: function (e) {

                var placement;

                // 如果 update 返回 false，表示后面的都不用继续了
                if (tooltip.update() === false
                    || !(placement = getTipPlacement(tooltip.source, tooltip.element, tooltip.placement))
                ) {
                    return false;
                }
                else {

                    // 全局定位
                    pinTip(tooltip, placement);

                    instance.window.resize(
                        tooltip.cache.resizer =
                        debounce(
                            function () {
                                pinTip(tooltip, placement);
                            },
                            50
                        )
                    );

                    if ($.isFunction(tooltip.onBeforeShow)) {
                        return tooltip.onBeforeShow(e);
                    }
                }
            }
        });
    }

    /**
     * 全局定位 tip 元素
     *
     * @inner
     * @param {Tooltip} tooltip
     * @param {string} placement
     */
    function pinTip(tooltip, placement) {

        var target = placementMap[placement];
        var gap = tooltip.gap;

        var options = {
            element: tooltip.element,
            attachmentElement: tooltip.source,
            offsetX: typeof gap.x === 'number'
                   ? gap.x
                   : 0,
            offsetY: typeof gap.y === 'number'
                   ? gap.y
                   : 0
        };

        if (typeof target.gap === 'function') {
            target.gap(options);
        }

        // 全局定位
        var offset = tooltip.offset && tooltip.offset[placement];
        if (offset) {
            if (typeof offset.x === 'number') {
                options.offsetX += offset.x;
            }
            if (typeof offset.y === 'number') {
                options.offsetY += offset.y;
            }
        }

        // 设置方位 class，便于添加箭头样式
        updatePlacementClass(tooltip, placement);

        // 设置完样式再调整位置，否则容易错误定位
        position[target.name](options);
    }

    /**
     * 获得 tip 放在 source 上下左右各自剩余的空间
     * 通过剩余空间可以自动算出最佳位置
     *
     * @inner
     * @param {jQuery} sourceElement
     * @param {jQuery} tipElement
     * @return {Object}
     */
    function getFreeSpace(sourceElement, tipElement) {

        // tip 元素宽高
        var tipWidth = tipElement.outerWidth();
        var tipHeight = tipElement.outerHeight();

        // 触发元素宽高
        var triggerWidth = sourceElement.outerWidth();
        var triggerHeight = sourceElement.outerHeight();

        var triggerPosition = sourceElement.offset();

        // 算出上下左右区域，放入 tip 后剩下的大小
        return {
            top: triggerPosition.top - tipHeight,
            bottom: pageHeight() - (triggerPosition.top + triggerHeight + tipHeight),
            left: triggerPosition.left - tipWidth,
            right: pageWidth() - (triggerPosition.left + triggerWidth + tipWidth)
        };
    }

    /**
     * 获取 tip 的方位
     *
     * @inner
     * @param {jQuery} sourceElement 触发 tip 的元素
     * @param {jQuery} tipElement tip 元素
     * @param {string} placement 设置的方位优先级，以,分隔
     * @return {string}
     */
    function getTipPlacement(sourceElement, tipElement, placement) {

        if (placementMap[placement]) {
            return placement;
        }

        // 拆解方位
        var parts = $.map(
            placement.split(','),
            function (item) {
                return $.trim(item);
            }
        );

        // 获得剩余空间
        var freeSpace = getFreeSpace(sourceElement, tipElement);

        // 标识是否尝试过
        var testPlacement = { };
        for (var key in placementMap) {
            testPlacement[key] = 0;
        }

        // 尝试方法
        var test = function (placement) {
            var item = placementMap[placement];
            return item && item.check(freeSpace);
        };

        var result;

        $.each(
            parts,
            function (index, current) {
                if (test(current)) {
                    result = current;
                    return false;
                }
                else if (current === 'auto') {
                    for (current in testPlacement) {
                        if (!testPlacement[current] && test(current)) {
                            result = current;
                            break;
                        }
                    }
                    return false;
                }
            }
        );

        return result;
    }


    return Tooltip;

});
