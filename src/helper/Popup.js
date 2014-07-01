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
     *    focus 专用于输入框
     *    click
     *    over ( mouseover 简写 )
     *
     * #怎样触发隐藏#
     *
     *    常见的触发方式包括：
     *
     *    blur ( 非输入框元素没有这个原生事件，因为类似输入框失焦，所以取同名 )
     *    out ( mouseout 简写 )
     *
     * #延时#
     *
     *    有时为了避免过于灵敏的触发，会设置 delay 来减少误操作
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
     *    因为触发显示和隐藏的方式的配置需求太强了，所以暴露了一个接口：
     *
     *    Popup.trigger
     *
     *    它们的结构都是
     *
     *    {
     *        addTrigger: function (popup),             // 传入 popup 实例，绑定触发事件
     *        removeTrigger: function (popup),          // 传入 popup 实例，解绑触发事件
     *
     *        addBreaker: function (popup, breaker),    // 因为 delay 会产生异步，所以要提供中断异步的方式
     *                                                  // 如 鼠标移出触发延时，鼠标再次移入就需要中断它
     *                                                  // breaker 参数不用关心实现，只需知道执行它能中断异步就行
     *        removeBreaker: function (popup, breaker)  // 解绑中断事件
     *    }
     *
     *    构造函数的 trigger.show 可选的值取决于 Popup.trigger.show 的键值
     *
     *    理论上来说，每种触发方式都能配置 delay，但从需求上来说，不可能存在这种情况
     *
     *    在配置 delay 时，只作用于第一个触发方式，如 trigger.show 配置为 'over,click'，只有 over 才会 delay
     *
     */

    'use strict';

    var split = require('../function/split');
    var contains = require('../function/contains');
    var instance = require('../util/instance');

    /**
     * 简单的弹出式交互
     *
     * 不涉及位置计算，仅包含显示/隐藏逻辑
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 弹出的元素
     * @property {jQuery=} options.source 触发弹出的元素，如果是调用方法触发显示，可不传
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
     * @property {Function=} options.onBeforeShow 返回 false 可阻止显示
     * @property {Function=} options.onAfterShow
     * @property {Function=} options.onBeforeHide 返回 false 可阻止隐藏
     * @property {Function=} options.onAfterHide
     *
     * @property {*} options.scope 指定以上这些函数的 this
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

            var me = this;

            if (!me.scope) {
                me.scope = me;
            }

            var hidden = me.element.css('display') === 'none';
            var trigger = me.trigger;

            me.cache = {
                hidden: hidden,
                showTrigger: trigger.show ? split(trigger.show, ',') : [ ],
                hideTrigger: trigger.hide ? split(trigger.hide, ',') : [ ]
            };

            var action = hidden ? showEvent : hideEvent;
            action(me, 'add');
        },

        /**
         * 显示
         */
        show: function () {

            var me = this;
            var event = arguments[0];

            if (onBeforeShow.call(me, event) === false) {
                return;
            }

            var show = me.animation.show;

            if ($.isFunction(show)) {
                show.call(me.scope);
            }
            else {
                me.element.show();
            }

            me.cache.hidden = false;

            onAfterShow.call(me, event);
        },

        /**
         * 隐藏
         */
        hide: function () {

            var me = this;
            var cache = me.cache;

            if (cache.hidden) {
                return;
            }

            var event = arguments[0];

            if (onBeforeHide.call(me, event) === false) {
                return;
            }

            var hide = me.animation.hide;

            if ($.isFunction(hide)) {
                hide.call(me.scope);
            }
            else {
                me.element.hide();
            }

            cache.hidden = true;

            onAfterHide.call(me, event);
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            me.hide();

            showEvent(me, 'remove');

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
    Popup.defaultOptions = {
        trigger: { },
        animation: { },
        delay: {
            show: 0,
            hide: 0
        }
    };

    /**
     * 提供 显示/隐藏 触发方式扩展
     *
     * @inner
     * @type {Object}
     */
    Popup.trigger = {

        show: {

            focus: {
                addTrigger: function (popup) {
                    popup.source.on('focus', popup, showByFocus);
                },
                removeTrigger: function (popup) {
                    popup.source.off('focus', showByFocus);
                }
            },

            click: {
                addTrigger: function (popup) {
                    popup.source.on('click', popup, showByClick);
                },
                removeTrigger: function (popup) {
                    popup.source.off('click', showByClick);
                }
            },

            over: {
                addTrigger: function (popup) {
                    popup.source.on('mouseenter', popup, showByOver);
                },
                removeTrigger: function (popup) {
                    popup.source.off('mouseenter', showByOver);
                },

                addBreaker: function (popup, breaker) {
                    popup.source.on('mouseleave', breaker);
                },
                removeBreaker: function (popup, breaker) {
                    popup.source.off('mouseleave', breaker);
                }
            }
        },

        hide: {

            blur: {
                addTrigger: function (popup) {
                    var cache = popup.cache;
                    cache.blurTimer = setTimeout(
                        function () {
                            if (popup) {
                                instance.document
                                        .click(
                                            'click',
                                            cache.blurHandler = hideByBlur(popup)
                                        );
                            }
                        },
                        150
                    );

                },
                removeTrigger: function (popup) {

                    var cache = popup.cache;
                    var blurTimer = cache.blurTimer;
                    var blurHandler = cache.blurHandler;

                    if (blurTimer) {
                        clearTimeout(blurTimer);
                        cache.blurTimer = null;
                    }

                    if (blurHandler) {
                        instance.document.off('click', blurHandler);
                        cache.blurHandler = null;
                    }
                }
            },

            out: {
                addTrigger: function (popup) {
                    popup.source.on('mouseleave', popup, hideByOut);
                    popup.element.on('mouseleave', popup, hideByOut);
                },
                removeTrigger: function (popup) {
                    popup.source.off('mouseleave', hideByOut);
                    popup.element.off('mouseleave', hideByOut);
                },

                addBreaker: function (popup, breaker) {
                    popup.source.on('mouseenter', breaker);
                    popup.element.on('mouseenter', breaker);
                },
                removeBreaker: function (popup, breaker) {
                    popup.source.off('mouseenter', breaker);
                    popup.element.off('mouseenter', breaker);
                }
            }
        }
    };

    /**
     * 处理 显示事件
     *
     * @inner
     * @param {Popup} popup
     * @param {string} action 可选值有 add remove
     */
    function showEvent(popup, action) {
        var showTrigger = Popup.trigger.show;
        $.each(
            popup.cache.showTrigger,
            function (index, name) {
                var target = showTrigger[name];
                if (target) {
                    target[action + 'Trigger'](popup);
                }
            }
        );
    }

    /**
     * 处理 隐藏事件
     *
     * @inner
     * @param {Popup} popup
     * @param {string} action 可选值有 add remove
     */
    function hideEvent(popup, action) {
        var hideTrigger = Popup.trigger.hide;
        $.each(
            popup.cache.hideTrigger,
            function (index, name) {
                var target = hideTrigger[name];
                if (target) {
                    target[action + 'Trigger'](popup);
                }
            }
        );
    }

    /**
     * 存储当前触发元素的 key
     *
     * @inner
     * @type {string}
     */
    var currentSourceKey = '__currentSource__';

    /**
     * 显示之前的拦截方法
     *
     * @inner
     * @param {Event=} event 触发事件
     */
    function onBeforeShow(event) {

        var me = this;
        var element = me.element;

        // 触发元素（mousenter 和 mouseleave 都有 target 元素，试了几次还比较可靠）
        var target = me.cache.target
                   = event && event.target;

        // 可能出现多个 source 共用一个弹出层的情况
        var currentSource = element.data(currentSourceKey);

        // 如果弹出元素当前处于显示状态
        if (currentSource) {

            // 无视重复触发显示
            if (currentSource.element === target) {
                return false;
            }

            // 如果是新的 source 则需隐藏旧的
            currentSource.hide();
        }

        var onBeforeShow = me.onBeforeShow;
        if ($.isFunction(onBeforeShow)) {
            return onBeforeShow.call(me.scope, event);
        }
    }

    /**
     * 显示完之后需要绑定事件触发隐藏逻辑
     *
     * @inner
     * @param {Event=} event
     */
    function onAfterShow(event) {

        var me = this;

        showEvent(me, 'remove');
        hideEvent(me, 'add');

        var target = me.cache.target;
        if (target) {
            me.element.data(
                currentSourceKey,
                {
                    element: target,
                    hide: $.proxy(me.hide, me)
                }
            );
        }

        var onAfterShow = me.onAfterShow;
        if ($.isFunction(onAfterShow)) {
            onAfterShow.call(me.scope, event);
        }
    }

    /**
     * 隐藏之前要确保元素是显示状态的
     *
     * @inner
     * @param {Event=} event
     */
    function onBeforeHide(event) {

        var me = this;
        var onBeforeHide = me.onBeforeHide;

        if ($.isFunction(onBeforeHide)) {
            return onBeforeHide.call(me.scope, event);
        }
    }

    /**
     * 隐藏之后需要解绑事件
     *
     * @inner
     * @param {Event=} event
     */
    function onAfterHide(event) {

        var me = this;

        me.element.removeData(currentSourceKey);
        hideEvent(me, 'remove');
        showEvent(me, 'add');

        var onAfterHide = me.onAfterHide;
        if ($.isFunction(onAfterHide)) {
            onAfterHide.call(me.scope, event);
        }
    }

    /**
     * 延时执行
     *
     * @inner
     * @param {Popup} popup
     * @param {number} time
     * @param {Object} condition 延时条件
     * @param {Function} handler
     */
    function setDelay(popup, time, condition, handler) {

        var cache = popup.cache;

        if (time > 0) {

            if (cache.delayTimer) {
                return;
            }

            var addBreaker = condition.addBreaker || $.noop;
            var removeBreaker = condition.removeBreaker || $.noop;

            var breaker = function () {
                if (clearDelay(popup)) {
                    removeBreaker(popup, breaker);
                    return true;
                }
            };

            cache.delayTimer = setTimeout(
                                    function () {
                                        if (breaker()) {
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
     * @inner
     * @param {Popup} popup
     * @return {boolean=} 返回 true 表示清理成功
     */
    function clearDelay(popup) {

        var cache = popup.cache;

        if (cache && cache.delayTimer) {
            clearTimeout(cache.delayTimer);
            cache.delayTimer = null;
            return true;
        }
    }

    /**
     * 输入框 facus 事件触发显示
     *
     * @inner
     * @param {Event} e
     */
    function showByFocus(e) {

        var popup = e.data;

        setDelay(
            popup,
            popup.delay.show,
            Popup.trigger.show.focus,
            function () {
                popup.show(e);
            }
        );
    }

    /**
     * click 事件触发显示
     *
     * @inner
     * @param {Event} e
     */
    function showByClick(e) {

        var popup = e.data;

        setDelay(
            popup,
            popup.delay.show,
            Popup.trigger.show.click,
            function () {
                popup.show(e);
            }
        );
    }

    /**
     * mouseenter 事件触发显示
     *
     * @inner
     * @param {Event} e
     */
    function showByOver(e) {

        var popup = e.data;

        setDelay(
            popup,
            popup.delay.show,
            Popup.trigger.show.over,
            function () {
                popup.show(e);
            }
        );
    }

    /**
     * 监听 document 点击，必须创建新的函数，不然解绑会影响其他实例
     *
     * @inner
     * @param {Popup} popup
     * @return {Function}
     */
    function hideByBlur(popup) {
        return function (e) {
            if (!contains(popup.element[0], e.target)) {
                setDelay(
                    popup,
                    popup.delay.hide,
                    Popup.trigger.hide.blur,
                    function () {
                        popup.hide(e);
                    }
                );
            }
        };
    }

    /**
     * mouseleave 触发隐藏任务
     *
     * @inner
     * @param {Event} e
     */
    function hideByOut(e) {

        var popup = e.data;
        var target = e.relatedTarget;

        if (!contains(popup.source[0], target)
            && !contains(popup.element[0], target)
        ) {
            setDelay(
                popup,
                popup.delay.hide,
                Popup.trigger.hide.out,
                function () {
                    popup.hide(e);
                }
            );
        }
    }


    return Popup;

});
