/**
 * @file Popup
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var advice = require('./advice');

    /**
     * 简单的弹出式交互
     *
     * 不涉及位置计算，仅包含显示/隐藏逻辑
     *
     * @constructor
     * @param {Object} options
     * @param {jQuery=} options.trigger 触发显示的元素，如果是调用方法触发显示，可不传
     * @param {jQuery} options.element 弹出显示的元素
     * @param {string=} options.showBy 可选值有 "click", "over", 如果未传 trigger，可不传
     * @param {string} options.hideBy 可选值有 "blur", "out", "blur,out"
     * @param {number=} options.showDelay 当 showBy 为 over 时的显示延时
     * @param {number=} options.hideDelay 当 hideBy 包含 out 时的隐藏延时
     * @param {Function=} options.show 可选，默认是 element.show()
     * @param {Function=} options.hide 可选，默认是 element.hide()
     * @param {Function=} options.onBeforeShow 返回 false 可阻止显示
     * @param {Function=} options.onAfterShow
     * @param {Function=} options.onBeforeHide 返回 false 可阻止隐藏
     * @param {Function=} options.onAfterHide
     */
    function Popup(options) {
        $.extend(this, Popup.defaultOptions, options);
        this.init();
    }

    Popup.prototype = {

        constructor: Popup,

        /**
         * 初始化
         */
        init: function () {

            this.cache = { };

            advice.around(
                this,
                'show',
                onBeforeShow,
                onAfterShow
            );

            advice.around(
                this,
                'hide',
                onBeforeHide,
                onAfterHide
            );

            addShowEvent(this);
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            this.hide();

            removeShowEvent(this);
            removeHideEvent(this);

            this.trigger =
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
    Popup.defaultOptions = {
        showDelay: 100,
        hideDelay: 200,
        show: function () {
            this.element.show();
        },
        hide: function () {
            this.element.hide();
        }
    };

    /**
     * document 比较常用的
     *
     * @private
     * @type {jQuery}
     */
    var doc = $(document);

    /**
     * 存储当前触发元素的 key
     *
     * @private
     * @type {string}
     */
    var currentTriggerKey = '__currentTrigger__';

    /**
     * 显示之前的拦截方法
     *
     * @private
     * @param {HTMLElement=} triggerElement 触发显示的元素
     */
    function onBeforeShow(triggerElement) {
        var element = this.element;

        // 可能出现多个 trigger 共用一个弹出层的情况
        var currentTrigger = element.data(currentTriggerKey);

        // 如果弹出元素当前处于显示状态
        if (currentTrigger) {
            // 无视重复触发显示
            if (currentTrigger.element === triggerElement) {
                return false;
            }
            // 如果是新的 trigger，则需隐藏旧的
            currentTrigger.hide();
        }

        // 如果手动调用 show()，不会有触发元素
        if (triggerElement) {
            element.data(
                currentTriggerKey,
                {
                    element: triggerElement,
                    hide: $.proxy(this.hide, this)
                }
            );
        }

        if (typeof this.onBeforeShow === 'function') {
            return this.onBeforeShow();
        }
    }

    /**
     * 显示完之后需要绑定事件触发隐藏逻辑
     *
     * @private
     * @param {HTMLElement} triggerElement
     */
    function onAfterShow() {
        removeShowEvent(this);
        addHideEvent(this);

        if (typeof this.onAfterShow === 'function') {
            this.onAfterShow();
        }
    }

    /**
     * 隐藏之前要确保元素是显示状态的
     *
     * @private
     */
    function onBeforeHide() {
        if (this.element.css('display') === 'none') {
            return false;
        }

        if (typeof this.onBeforeHide === 'function') {
            return this.onBeforeHide();
        }
    }

    /**
     * 隐藏之后需要解绑事件
     *
     * @private
     */
    function onAfterHide() {
        this.element.removeData(currentTriggerKey);
        removeHideEvent(this);
        addShowEvent(this);

        if (typeof this.onAfterHide === 'function') {
            this.onAfterHide();
        }
    }

    /**
     * 添加触发显示的事件
     *
     * @private
     * @param {Popup} popup
     */
    function addShowEvent(popup) {
        var trigger = popup.trigger;

        switch (popup.showBy) {
            case 'click':
                trigger.on('click', popup, showByClick);
                break;
            case 'over':
                trigger.on('mouseenter', popup, showByMouseEnter);
                trigger.on('mouseleave', popup, showByMouseLeave);
                break;
        }
    }

    /**
     * 移除触发显示的事件
     *
     * @private
     * @param {Popup} popup
     */
    function removeShowEvent(popup) {
        var trigger = popup.trigger;

        switch (popup.showBy) {
            case 'click':
                trigger.off('click', showByClick);
                break;
            case 'over':
                trigger.off('mouseenter', showByMouseEnter);
                trigger.off('mouseleave', showByMouseLeave);
                break;
        }
    }

    /**
     * 添加触发隐藏的事件
     *
     * @private
     * @param {Popup} popup
     */
    function addHideEvent(popup) {
        var hideBy = popup.hideBy;
        var element = popup.element;

        if (hideBy.indexOf('out') !== -1) {
            var trigger = popup.trigger;

            trigger.on('mouseleave', popup, hideByMouseLeave);
            trigger.on('mouseenter', popup, hideByMouseEnter);
            element.on('mouseleave', popup, hideByMouseLeave);
            element.on('mouseenter', popup, hideByMouseEnter);
        }

        if (hideBy.indexOf('blur') !== -1) {
            var blurHandler = function (e) {
                if (isOutside(e.target, element[0])) {
                    popup.hide();
                }
            };
            popup.cache.blurHandler = blurHandler;

            // 用延时来避免 click 事件冒泡到 document 带来的悲剧
            if (popup.showBy === 'click') {
                setTimeout(
                    function () {
                        // 异步得确保未调用 dispose()
                        if (popup.cache) {
                            doc.click(blurHandler);
                        }
                    },
                    50
                );
            }
            else {
                doc.click(blurHandler);
            }
        }
    }


    /**
     * 移除用于触发隐藏的事件
     *
     * @private
     * @param {Popup} popup
     */
    function removeHideEvent(popup) {
        var trigger = popup.trigger;
        var element = popup.element;
        var hideBy = popup.hideBy;

        if (hideBy.indexOf('out') !== -1) {
            trigger.off('mouseleave', hideByMouseLeave);
            trigger.off('mouseenter', hideByMouseEnter);
            element.off('mouseleave', hideByMouseLeave);
            element.off('mouseenter', hideByMouseEnter);
        }
        if (hideBy.indexOf('blur') !== -1) {
            var blurHandler = popup.cache.blurHandler;
            if (blurHandler) {
                doc.off('click', blurHandler);
            }
        }
    }

    /**
     * click 事件触发显示
     *
     * @private
     * @param {Event} e
     */
    function showByClick(e) {
        e.data.show(e.target);
    }

    /**
     * mouseenter 事件触发显示
     *
     * @private
     * @param {Event} e
     */
    function showByMouseEnter(e) {

        var popup = e.data;
        var cache = popup.cache;

        // 任务正等待执行
        if (cache.showTask) {
            return;
        }

        // 启动显示任务
        // 延时显示，不然太灵敏了
        cache.showTask = setTimeout(
            function () {
                if (popup.cache && cache.showTask) {
                    popup.show(e.toElement);
                    cache.showTask = null;
                }
            },
            popup.showDelay
        );
    }

    /**
     * 为了避免太灵敏的触发显示
     * mouseenter 会开始一个显示任务，mouseleave 取消任务
     *
     * @private
     * @param {Event} e
     */
    function showByMouseLeave(e) {
        var cache = e.data.cache;
        if (cache.showTask) {
            clearTimeout(cache.showTask);
            cache.showTask = null;
        }
    }

    /**
     * mouseleave 触发隐藏任务
     *
     * @private
     * @param {Event} e
     */
    function hideByMouseLeave(e) {

        var popup = e.data;
        var cache = popup.cache;

        // 可能会重复触发
        if (cache.hideTask) {
            return;
        }

        if (!isOutside(
                e.toElement,
                popup.trigger[0],
                popup.element[0])
        ) {
            return;
        }

        // 启动隐藏任务
        cache.hideTask = setTimeout(
            function () {
                if (popup.cache && cache.hideTask) {
                    popup.hide();
                    cache.hideTask = null;
                }
            },
            popup.hideDelay
        );
    }

    /**
     * mouseleave 之后如果触发 mouseenter 需删掉隐藏任务
     *
     * @private
     * @param {Event} e
     */
    function hideByMouseEnter(e) {
        var cache = e.data.cache;
        if (cache.hideTask) {
            clearTimeout(cache.hideTask);
            cache.hideTask = null;
        }
    }

    /**
     * target 是否在 arguments[1], arguments[2], ... 之外
     *
     * @private
     * @param {HTMLElement} target 目标元素
     * @param {...HTMLElement} container 容器元素
     * @return {boolean}
     */
    function isOutside(target, container) {
        for (var i = 1, len = arguments.length; i < len; i++) {
            container = arguments[i];
            if (container === target
                || $.contains(container, target)
            ) {
                return false;
            }
        }
        return true;
    }


    return Popup;

});
