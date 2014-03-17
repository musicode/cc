/**
 * @file Popup
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * 弹出式交互使用的非常普遍
     *
     * 抽象的说就是通过怎样的交互触发一个元素的显示，以及后续怎么隐藏它的问题
     *
     * #怎样触发显示#
     *
     *    常见的触发方式包括：
     *
     *    click
     *    over ( mouseover 简写 )
     *
     * #怎样触发隐藏#
     *
     *    常见的触发方式包括：
     *
     *    blur ( 没有这个原生事件，因为类似输入框失焦，所以取同名 )
     *    out ( mouseout 简写 )
     *
     * #延时#
     *
     *    有时为了避免过于灵敏的触发，会设置一个 showDelay/hideDelay 来减少误操作
     *
     * #多种触发方式#
     *
     *    比较常用的组合是 'out,blur'，即 鼠标移出 和 元素失焦 都会触发隐藏
     *
     *    如果没有隐藏延时，这个组合是不可能实现的，因为一旦移出，肯定是 out 率先生效，blur 等于没写
     *    如果设置隐藏延时，为了避免问题复杂化，需要把隐藏延时的方式写在首位（后面会说理由）
     *
     * #可配置的触发方式#
     *
     *    因为触发显示和隐藏的方式的配置需求太强了，所以暴露了两个接口：
     *
     *    Popup.showBy 和 Popup.hideBy
     *
     *    它们的结构都是
     *
     *    trigger: {
     *        addEvent: function (popup),             // 传入 popup 实例，绑定触发事件
     *        removeEvent: function (popup),          // 传入 popup 实例，解绑触发事件
     *
     *        addBreaker: function (popup, breaker),  // 因为 delay 会产生异步，所以要提供中断异步的可能性
     *                                                // 如 鼠标移出触发延时，鼠标再次移入就需要中断它
     *                                                // breaker 参数不用关心实现，只需知道执行它能中断异步就行
     *        removeBreaker: function (popup, breaker)// 解绑中断事件
     *
     *    }
     *
     *    构造函数的 showBy 参数值取决于 Popup.showBy 的键值
     *
     *    理论上来说，每种触发方式都能配置 delay，但从需求上来说，不可能存在这种情况
     *
     *    在配置 showDelay 时，只作用于第一个触发方式，如 showBy 配置为 'over,click'，只有 over 才会 delay
     *    hideDelay 同理
     *
     */

    'use strict';

    var advice = require('./advice');

    /**
     * 简单的弹出式交互
     *
     * 不涉及位置计算，仅包含显示/隐藏逻辑
     *
     * @constructor
     * @param {Object} options
     * @param {jQuery} options.element 弹出显示的元素
     * @param {jQuery=} options.trigger 触发显示的元素，如果是调用方法触发显示，可不传
     * @param {string=} options.showBy 可选值请看 Popup.showBy 的 key，可组合使用，如 'click,over'
     * @param {string} options.hideBy 可选值请看 Popup.hideBy 的 key，可组合使用，如 'blur,out'
     * @param {number=} options.showDelay 给 showBy 的第一个触发方式加显示延时，如 'over,click' 中的 over
     * @param {number=} options.hideDelay 给 hideBy 的第一个触发方式加隐藏延时，如 'out,blur' 中的 out
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

            showEvent(this, 'add');
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            this.hide();

            showEvent(this, 'remove');
            hideEvent(this, 'remove');

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
        show: function () {
            this.element.show();
        },
        hide: function () {
            this.element.hide();
        }
    };

    /**
     * 提供 showBy 扩展
     *
     * @type {Object}
     */
    Popup.showBy = {

        click: {
            addEvent: function (popup) {
                var trigger = popup.trigger;
                trigger.on('click', popup, showByClick);
            },
            removeEvent: function (popup) {
                var trigger = popup.trigger;
                trigger.off('click', showByClick);
            },

            addBreaker: function (popup, breaker) {
                setTimeout(
                    function () {
                        if (popup.cache) {
                            doc.click(breaker);
                        }
                    },
                    50
                );
            },
            removeBreaker: function (popup, breaker) {
                doc.off('click', breaker);
            }
        },

        over: {
            addEvent: function (popup) {
                popup.trigger.on('mouseenter', popup, showByOver);
            },
            removeEvent: function (popup) {
                popup.trigger.off('mouseenter', showByOver);
            },

            addBreaker: function (popup, breaker) {
                popup.trigger.on('mouseleave', breaker);
            },
            removeBreaker: function (popup, breaker) {
                popup.trigger.off('mouseleave', breaker);
            }
        }
    };

    /**
     * 提供 hideBy 扩展
     *
     * @type {Object}
     */
    Popup.hideBy = {

        blur: {
            addEvent: function (popup) {
                var handler = hideByBlur(popup);
                popup.cache.blurHandler = handler;

                var showBy = popup.showBy;

                if (typeof showBy === 'string'
                    && showBy.indexOf('click') >= 0
                ) {
                    setTimeout(
                        function () {
                            // 异步得确保未调用 dispose()
                            if (popup.cache) {
                                doc.click(handler);
                            }
                        },
                        50
                    );
                }
                else {
                    doc.click('click', handler);
                }
            },
            removeEvent: function (popup) {
                var handler = popup.cache.blurHandler;
                if (handler) {
                    doc.off('click', handler);
                }
            }
        },

        out: {
            addEvent: function (popup) {
                popup.trigger.on('mouseleave', popup, hideByOut);
                popup.element.on('mouseleave', popup, hideByOut);
            },
            removeEvent: function (popup) {
                popup.trigger.off('mouseleave', hideByOut);
                popup.element.off('mouseleave', hideByOut);
            },

            addBreaker: function (popup, breaker) {
                popup.trigger.on('mouseenter', breaker);
                popup.element.on('mouseenter', breaker);
            },
            removeBreaker: function (popup, breaker) {
                popup.trigger.off('mouseenter', breaker);
                popup.element.off('mouseenter', breaker);
            }
        }
    };

    /**
     * 处理 显示事件
     *
     * @private
     * @param {Popup} popup
     * @param {string} action 可选值有 add remove
     */
    function showEvent(popup, action) {
        each(popup.showBy, function (showBy) {
            var target = Popup.showBy[showBy];
            if (target) {
                target[action + 'Event'](popup);
            }
        });
    }

    /**
     * 处理 隐藏事件
     *
     * @private
     * @param {Popup} popup
     * @param {string} action 可选值有 add remove
     */
    function hideEvent(popup, action) {
        each(popup.hideBy, function (hideBy) {
            var target = Popup.hideBy[hideBy];
            if (target) {
                target[action + 'Event'](popup);
            }
        });
    }

    /**
     * 遍历 out,blur 这样以逗号分隔的字符串
     *
     * @param {string} str
     * @return {function(string)) callback
     */
    function each(str, callback) {
        $.each(
            str.split(','),
            function (index, item) {
                callback($.trim(item));
            }
        );
    }

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
        showEvent(this, 'remove');
        hideEvent(this, 'add');

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
        hideEvent(this, 'remove');
        showEvent(this, 'add');

        if (typeof this.onAfterHide === 'function') {
            this.onAfterHide();
        }
    }

    /**
     * 延时执行
     *
     * @private
     * @param {Popup} popup
     * @param {number} time
     * @param {Function} handler
     * @param {Object} condition 延时条件
     */
    function setDelay(popup, time, handler, condition) {

        var cache = popup.cache;

        if (time > 0) {
            if (cache.delayTask) {
                return;
            }

            var addBreaker = condition.addBreaker || $.noop;
            var removeBreaker = condition.removeBreaker || $.noop;
            var breaker = function () {
                removeBreaker(popup, breaker);
                clearDelay(popup);
            };

            cache.delayTask = setTimeout(
                function () {
                    removeBreaker(popup, breaker);
                    if (clearDelay(popup)) {
                        handler();
                    }
                },
                time
            );

            addBreaker(popup, breaker);
        }
        else {
            handler();
        }
    }

    /**
     * 清理延时任务
     *
     * @private
     * @param {Popup} popup
     * @return {boolean=} 返回 true 表示清理成功
     */
    function clearDelay(popup) {

        var cache = popup.cache;

        // 调用 dispose 会把 popup.cache 置为 null
        // 异步必须检查一下
        if (cache && cache.delayTask) {
            clearTimeout(cache.delayTask);
            cache.delayTask = null;
            return true;
        }
    }

    /**
     * click 事件触发显示
     *
     * @private
     * @param {Event} e
     */
    function showByClick(e) {

        var popup = e.data;

        setDelay(
            popup,
            popup.showDelay,
            function () {
                popup.show(e.target);
            },
            Popup.showBy.click
        );
    }

    /**
     * mouseenter 事件触发显示
     *
     * @private
     * @param {Event} e
     */
    function showByOver(e) {

        var popup = e.data;

        setDelay(
            popup,
            popup.showDelay,
            function () {
                popup.show(e.toElement);
            },
            Popup.showBy.over
        );
    }

    /**
     * 监听 document 点击，必须创建新的函数，不然解绑会影响其他实例
     *
     * @param {Popup} popup
     * @return {Function}
     */
    function hideByBlur(popup) {
        return function (e) {
            if (isOutside(e.target, popup.element[0])) {
                setDelay(
                    popup,
                    popup.hideDelay,
                    $.proxy(popup.hide, popup),
                    Popup.hideBy.blur
                );
            }
        };
    }

    /**
     * mouseleave 触发隐藏任务
     *
     * @private
     * @param {Event} e
     */
    function hideByOut(e) {

        var popup = e.data;

        if (isOutside(
                e.toElement,
                popup.trigger[0],
                popup.element[0])
        ) {
            setDelay(
                popup,
                popup.hideDelay,
                $.proxy(popup.hide, popup),
                Popup.hideBy.out
            );
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
            if (container === target || $.contains(container, target)) {
                return false;
            }
        }
        return true;
    }


    return Popup;

});
