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
     *    update: function (tipElement, triggerElement) {
     *        tipElement.find('.content').html(triggerElement.attr('title'));
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
     */

    'use strict';

    var Popup = require('./Popup');
    var position = require('./position');

    /**
     * 工具提示
     *
     * @constructor
     * @param {Object} options
     * @param {jQuery} options.element 需要工具提示的元素
     * @param {string=} options.placement 提示元素出现的位置，可选值包括 left right top bottom auto，可组合使用 如 'bottom,auto'，表示先尝试 bottom，不行就 auto
     * @param {string=} options.placementAttr 优先级比 placement 更高的位置配置
     * @param {string=} options.placementPrefix 提示方位的 class 前缀，有助于实现小箭头之类的效果
     * @param {string=} options.showBy 触发显示的方式，可选值包括 over click
     * @param {string=} options.hideBy 触发隐藏的方式，可选值包括 out blur 可组合使用，如 out,blur
     * @param {number=} options.showDelay 当 showBy 为 over 的显示延时
     * @param {number=} options.hideDelay 当 hideBy 包含 out 的隐藏延时
     * @param {number=} options.gapX 横向间距，如果为 0，提示会和元素贴在一起
     * @param {number=} options.gapY 纵向间距，如果为 0，提示会和元素贴在一起
     * @param {Object=} options.offset 设置四个方向的偏移量
     * @param {string=} options.template 提示元素的模版，可配合使用 placementPrefix, update 实现特殊需求
     * @param {function(jQuery)=} options.show 显示提示的方式，可扩展实现动画
     * @param {function(jQuery)=} options.hide 显示提示的方式，可扩展实现动画
     * @param {function(jQuery,jQuery)=} options.update 更新 tip 元素的内容
     * @param {Function=} options.onBeforeShow
     * @param {Function=} options.onAfterShow
     * @param {Function=} options.onBeforeHide
     * @param {Function=} options.onAfterHide
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
            var element = me.element;
            var titleAttr = this.titleAttr;

            this.title = element.attr(titleAttr);
            this.placement = element.attr(this.placementAttr) || me.placement;

            // 避免出现原生的提示
            element.removeAttr(titleAttr);

            this.cache = {
                popup: new Popup({

                    trigger: element,
                    element: getTipElement(),

                    showBy: this.showBy,
                    hideBy: this.hideBy,

                    showDelay: this.showDelay,
                    hideDelay: this.hideDelay,

                    show: function () {
                        me.show(getTipElement());
                    },
                    hide: function () {
                        me.hide(getTipElement());
                    },

                    onAfterShow: $.proxy(this.onAfterShow, this),
                    onBeforeHide: $.proxy(this.onBeforeHide, this),
                    onAfterHide: $.proxy(this.onAfterHide, this),
                    onBeforeShow: function () {

                        var tipElement = getTipElement();

                        // 更新浮层内容
                        me.update(tipElement, element);

                        var options = {
                            element: tipElement,
                            attachment: element,
                            offsetX: me.gapX,
                            offsetY: me.gapY
                        };

                        var actualPlacement = getTipPlacement(element, me.placement);

                        if (actualPlacement) {

                            var item = placementMap[actualPlacement];
                            item.gap(options);

                            var offset = me.offset && me.offset[actualPlacement];
                            if (offset) {
                                options.offsetX += offset.x;
                                options.offsetY += offset.y;
                            }

                            position[item.name](options);

                            if (tipPlacementClass) {
                                tipElement.removeClass(tipPlacementClass);
                            }
                            if (me.placementPrefix) {
                                tipPlacementClass = me.placementPrefix + actualPlacement;
                                tipElement.addClass(tipPlacementClass);
                            }

                            if (typeof me.onBeforeShow === 'function') {
                                return me.onBeforeShow();
                            }
                        }
                        else {
                            return false;
                        }
                    }
                })
            };
        },

        /**
         * 销毁对象
         */
        dispose: function () {
            var cache = this.cache;
            cache.popup.dispose();

            this.element =
            this.cache = null;
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

        showBy: 'over',
        hideBy: 'blur,out',
        showDelay: 200,
        hideDelay: 200,

        gapX: 5,
        gapY: 5,
        offset: { },

        template: '<div class="tooltip"></div>',

        show: function (tipElement) {
            tipElement.show();
        },
        hide: function (tipElement) {
            tipElement.hide();
        },
        update: function (tipElement, triggerElement) {
            var tip = triggerElement.attr(Tooltip.defaultOptions.titleAttr) || '';
            tipElement.html(tip);
        }
    };

    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery=} element 需要提示浮层的元素
     * @return {Array.<Tooltip>}
     */
    Tooltip.init = function (elements) {

        elements = elements || $('[' + Tooltip.defaultOptions.titleAttr + ']');

        var result = [ ];
        elements.each(function () {
            result.push(
                new Tooltip({
                    element: $(this)
                })
            );
        });

        return result;
    };

    /**
     * 方位映射表
     *
     * @private
     * @type {Object}
     */
    var placementMap = {

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

        right: {
            name: 'middleRight',
            check: function (options) {
                return options.right > 0;
            },
            gap: function (options) {
                options.offsetY = 0;
            }
        }

    };

    /**
     * 全局唯一的 tip 元素
     *
     * @private
     * @type {jQuery}
     */
    var tipElement;

    /**
     * 当前 tip 的 placementClass
     *
     * @private
     * @type {string}
     */
    var tipPlacementClass;

    /**
     * 获取页面容器元素
     *
     * @private
     * @return {jQuery}
     */
    function getPageElement() {
        var doc = $(document.documentElement);
        var body = $(document.body);
        return doc.prop('scrollHeight') > body.prop('scrollHeight')
             ? doc
             : body;
    }

    /**
     * 获取单例 tip 元素
     *
     * @private
     * @return {jQuery}
     */
    function getTipElement() {
        if (!tipElement) {
            tipElement = $(Tooltip.defaultOptions.template);
            tipElement.appendTo(document.body);
        }
        return tipElement;
    }

    /**
     * 获取 tip 的方位
     *
     * @private
     * @param {jQuery} trigger 触发 tip 的元素
     * @param {string} placement 设置的方位优先级，以,分隔
     * @return {string}
     */
    function getTipPlacement(trigger, placement) {

        var parts = placement.split(',');
        if (parts.length === 1 && parts[0] !== 'auto') {
            return parts[0];
        }

        var pageElement = getPageElement();

        var pageWidth = pageElement.prop('scrollWidth');
        var pageHeight = pageElement.prop('scrollHeight');
        var tipWidth = tipElement.outerWidth();
        var tipHeight = tipElement.outerHeight();
        var triggerWidth = trigger.outerWidth();
        var triggerHeight = trigger.outerHeight();

        var triggerPosition = trigger.offset();

        // 算出上下左右区域，放入 tip 后剩下的大小
        var rect = {
            top: triggerPosition.top - tipHeight,
            bottom: pageHeight - (triggerPosition.top + triggerHeight + tipHeight),
            left: triggerPosition.left - tipWidth,
            right: pageWidth - (triggerPosition.left + triggerWidth + tipWidth)
        };

        // 标识是否尝试过
        var testMap = {
            bottom: 0,
            top: 0,
            right: 0,
            left: 0
        };

        var result;

        $.each(
            parts,
            function (index, current) {
                current = $.trim(current);
                if (testPlacement(current, rect)) {
                    result = current;
                    return false;
                }
                else if (current === 'auto') {
                    for (var key in testMap) {
                        if (!testMap[key] && testPlacement(key, rect)) {
                            result = key;
                            break;
                        }
                    }
                    return false;
                }
            }
        );

        return result;
    }

    /**
     * 与 getTipPlacement 配合使用，测试 placement 是否可以正常显示
     *
     * @private
     * @param {string=} placement 方位值
     * @param {Object} rect 矩形范围
     * @return {boolean}
     */
    function testPlacement(placement, rect) {
        var item = placementMap[placement];
        return item && item.check(rect);
    }

    return Tooltip;

});
