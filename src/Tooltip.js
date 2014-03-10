/**
 * @file Tooltip
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * 鼠标悬浮元素，弹出提示浮层
     *
     * 浮层内容为该元素某个属性的值
     * 浮层方位可设置，若未设置，则根据元素所在位置自动算出最适合浮层展现的方位
     *
     * 鉴于需求较多，可通过 Tooltip.defaultOptions 进行配置
     *
     * tipAttr: '浮层内容读取的属性，如 data-tip'
     * dirAttr: '浮层方位读取的属性，如 data-dir'
     *
     * 方位属性值可选值如下：
     * tl tc tr
     * ml    mr
     * bl bc br
     *
     * 偏移量已默认设置为 5px，保证提示浮层不会和触发元素贴在一起
     * 如不满足需求，可设置 offsetX 和 offsetY
     */

    'use strict';

    var Popup = require('./Popup');
    var position = require('./position');

    /**
     * 工具提示
     *
     * @constructor
     * @param {Object} options
     * @param {jQuery} options.element 需要展现 tip 的元素
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

            this.cache = {
                popup: new Popup({
                    trigger: this.element,
                    element: getTipElement(),
                    showBy: this.showBy,
                    hideBy: this.hideBy,
                    showDelay: this.showDelay,
                    hideDelay: this.hideDelay,
                    show: function () {
                        me.show(getTipElement(), me.element);
                    },
                    hide: function () {
                        me.hide(getTipElement(), me.element);
                    },
                    onAfterShow: $.proxy(this.onAfterShow, this),
                    onBeforeHide: $.proxy(this.onBeforeHide, this),
                    onAfterHide: $.proxy(this.onAfterHide, this),
                    onBeforeShow: function () {

                        var trigger = me.element;
                        var tipElement = getTipElement();

                        // 更新浮层内容
                        me.update(tipElement, trigger);

                        // 确定浮层方位
                        var dir = trigger.attr(me.dirAttr) || getTipDir(trigger);

                        if (dir && dirMap[dir]) {

                            var options = {
                                element: tipElement,
                                attachment: trigger,
                                offsetX: me.offsetX,
                                offsetY: me.offsetY
                            };

                            var item = dirMap[dir];
                            if (typeof item.offset === 'function') {
                                item.offset(options);
                            }

                            if (tipDirClass) {
                                tipElement.removeClass(tipDirClass);
                            }
                            tipDirClass = me.dirPrefix + dir;
                            tipElement.addClass(tipDirClass);

                            position[item.name](options);

                            if (typeof me.onBeforeShow === 'function') {
                                me.onBeforeShow();
                            }

                            return;
                        }

                        return false;
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

        /**
         * 读取元素的哪个 attribute 获取提示内容
         *
         * @type {string}
         */
        tipAttr: 'data-tip',

        /**
         * 读取元素的哪个 attribute 获取提示方位
         *
         * @type {string}
         */
        dirAttr: 'data-dir',

        /**
         * 提示方位的 class 前缀
         *
         * @type {string}
         */
        dirPrefix: 'tooltip-dir-',

        /**
         * 触发显示的方式
         *
         * @type {string}
         */
        showBy: 'over',

        /**
         * 触发隐藏的方式
         *
         * @type {string}
         */
        hideBy: 'blur,out',

        /**
         * showBy 为 over 时的显示延时
         *
         * @type {number}
         */
        showDelay: 200,

        /**
         * hideBy 包含 out 时的显示延时
         *
         * @type {number}
         */
        hideDelay: 200,

        /**
         * 横坐标偏移量
         *
         * @type {number}
         */
        offsetX: 5,

        /**
         * 纵坐标偏移量
         *
         * @type {number}
         */
        offsetY: 5,

        /**
         * 提示元素的模版
         *
         * @type {string}
         */
        template: '<div class="tooltip"></div>',

        /**
         * 自动计算方位时，按定义的优先级顺序进行尝试
         *
         * @type {Array.<string>}
         */
        dirPriority: [
                        'bc', 'br', 'bl',
                        'tc', 'tr', 'tl',
                        'mr', 'ml'
                      ],

        /**
         * 显示 tip
         *
         * @param {jQuery} tipElement 提示浮层元素
         * @param {jQuery} trigger 触发元素
         */
        show: function (tipElement, triggerElement) {
            tipElement.show();
        },

        /**
         * 显示 tip
         *
         * @param {jQuery} tipElement 提示浮层元素
         * @param {jQuery} trigger 触发元素
         */
        hide: function (tipElement, triggerElement) {
            tipElement.hide();
        },

        /**
         * 更新 tip 元素的内容，与 template, dirPrefix 配合使用可实现小箭头
         *
         * @param {jQuery} tipElement 提示浮层元素
         * @param {jQuery} trigger 触发元素
         */
        update: function (tipElement, triggerElement) {
            var tip = triggerElement.attr(this.tipAttr) || '';
            tipElement.html(tip);
        }

    };

    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery=} element 需要提示浮层的元素，默认按 tipAttr 配置全局初始化
     * @return {Array.<Tooltip>}
     */
    Tooltip.init = function (elements) {
        elements = elements || $('[' + Tooltip.defaultOptions.tipAttr + ']');

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
    var dirMap = {
        tl: {
            name: 'topLeft',
            check: function (options) {
                return options.top > 0
                    && options.left > 0;
            },
            offset: function (options) {
                options.offsetX *= -1;
                options.offsetY *= -1;
            }
        },
        tc: {
            name: 'topCenter',
            check: function (options) {
                return options.top > 0
                    && options.left > 0
                    && options.right > 0;
            },
            offset: function (options) {
                options.offsetY *= -1;
            }
        },
        tr: {
            name: 'topRight',
            check: function (options) {
                return options.top > 0
                    && options.right > 0;
            },
            offset: function (options) {
                options.offsetY *= -1;
            }
        },
        ml: {
            name: 'middleLeft',
            check: function (options) {
                return options.left > 0;
            },
            offset: function (options) {
                options.offsetX *= -1;
                options.offsetY = 0;
            }
        },
        mr: {
            name: 'middleRight',
            check: function (options) {
                return options.right > 0;
            },
            offset: function (options) {
                options.offsetY = 0;
            }
        },
        bl: {
            name: 'bottomLeft',
            check: function (options) {
                return options.bottom > 0
                    && options.left > 0;
            },
            offset: function (options) {
                options.offsetX *= -1;
            }
        },
        bc: {
            name: 'bottomCenter',
            check: function (options) {
                return options.bottom > 0
                    && options.left > 0
                    && options.right > 0;
            },
            offset: function (options) {
                options.offsetX = 0;
            }
        },
        br: {
            name: 'bottomRight',
            check: function (options) {
                return options.bottom > 0
                    && options.right > 0;
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
     * 当前 tip 的 dirClass
     *
     * @private
     * @type {string}
     */
    var tipDirClass;

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
     * @return {string}
     */
    function getTipDir(trigger) {

        var pageElement = getPageElement();

        var pageWidth = pageElement.prop('scrollWidth');
        var pageHeight = pageElement.prop('scrollHeight');
        var tipWidth = tipElement.outerWidth();
        var tipHeight = tipElement.outerHeight();
        var triggerWidth = trigger.outerWidth();
        var triggerHeight = trigger.outerHeight();

        var triggerPosition = trigger.offset();

        // 算出上下左右区域，放入 tip 后剩下的大小
        var options = {
            top: triggerPosition.top - tipHeight,
            bottom: pageHeight - (triggerPosition.top + triggerHeight + tipHeight),
            left: triggerPosition.left - tipWidth,
            right: pageWidth - (triggerPosition.left + triggerWidth + tipWidth)
        };

        var result;

        $.each(
            Tooltip.defaultOptions.dirPriority,
            function (index, dir) {
                var item = dirMap[dir];
                if (item && item.check(options)) {
                    result = dir;
                    return false;
                }
            }
        );

        return result;
    }


    return Tooltip;

});
