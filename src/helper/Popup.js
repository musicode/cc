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
     *        addTrigger: function (popup),             // 传入 popup 实例，绑定触发事件
     *        removeTrigger: function (popup),          // 传入 popup 实例，解绑触发事件
     *
     *        addBreaker: function (popup, breaker),    // 因为 delay 会产生异步，所以要提供中断异步的方式
     *                                                  // 如 鼠标移出触发延时，鼠标再次移入就需要中断它
     *                                                  // breaker 参数不用关心实现，只需知道执行它能中断异步就行
     *        removeBreaker: function (popup, breaker)  // 解绑中断事件
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

    var advice = require('../util/advice');
    var instance = require('../util/instance');

    /**
     * 简单的弹出式交互
     *
     * 不涉及位置计算，仅包含显示/隐藏逻辑
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 弹出显示的元素
     * @property {jQuery=} options.trigger 触发显示的元素，如果是调用方法触发显示，可不传
     * @property {string=} options.showBy 可选值请看 Popup.showBy 的 key，可组合使用，如 'click,over'
     * @property {string} options.hideBy 可选值请看 Popup.hideBy 的 key，可组合使用，如 'blur,out'
     * @property {number=} options.showDelay 给 showBy 的第一个触发方式加显示延时，如 'over,click' 中的 over
     * @property {number=} options.hideDelay 给 hideBy 的第一个触发方式加隐藏延时，如 'out,blur' 中的 out
     * @property {Function=} options.show 可选，默认是 element.show()
     * @property {Function=} options.hide 可选，默认是 element.hide()
     * @property {Function=} options.onBeforeShow 返回 false 可阻止显示
     * @property {Function=} options.onAfterShow
     * @property {Function=} options.onBeforeHide 返回 false 可阻止隐藏
     * @property {Function=} options.onAfterHide
     *
     * @property {*} options.scope 指定 onBeforeShow、onAfterShow、onBeforeHide、onAfterHide 的 this
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

            me.cache = { };

            advice.around(
                me,
                'show',
                onBeforeShow,
                onAfterShow
            );

            advice.around(
                me,
                'hide',
                onBeforeHide,
                onAfterHide
            );

            var fn = me.element.css('display') === 'none'
                   ? showEvent
                   : hideEvent;

            fn(me, 'add');
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;
            var cache = me.cache;

            me.hide();

            if (cache.removeBreaker) {
                cache.removeBreaker();
            }

            showEvent(me, 'remove');

            me.trigger =
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

        focus: {
            addTrigger: function (popup) {
                popup.trigger.on('focus', popup, showByFocus);
            },
            removeTrigger: function (popup) {
                popup.trigger.off('focus', showByFocus);
            }
        },

        click: {
            addTrigger: function (popup) {
                popup.trigger.on('click', popup, showByClick);
            },
            removeTrigger: function (popup) {
                popup.trigger.off('click', showByClick);
            }
        },

        over: {
            addTrigger: function (popup) {
                popup.trigger.on('mouseenter', popup, showByOver);
            },
            removeTrigger: function (popup) {
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
            addTrigger: function (popup) {
                instance.document.click('click', popup.cache.blurHandler = hideByBlur(popup));
            },
            removeTrigger: function (popup) {
                var cache = popup.cache;
                var handler = cache.blurHandler;
                if (handler) {
                    instance.document.off('click', handler);
                    cache.blurHandler = null;
                }
            }
        },

        out: {
            addTrigger: function (popup) {
                popup.trigger.on('mouseleave', popup, hideByOut);
                popup.element.on('mouseleave', popup, hideByOut);
            },
            removeTrigger: function (popup) {
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
     * @inner
     * @param {Popup} popup
     * @param {string} action 可选值有 add remove
     */
    function showEvent(popup, action) {
        // 显示可能来自 popup.show 调用
        // 这种情况不需要设置 showBy 也可以
        var showBy = popup.showBy;
        if (showBy) {
            each(showBy, function (showBy) {
                var target = Popup.showBy[showBy];
                if (target) {
                    target[action + 'Trigger'](popup);
                }
            });
        }
    }

    /**
     * 处理 隐藏事件
     *
     * @inner
     * @param {Popup} popup
     * @param {string} action 可选值有 add remove
     */
    function hideEvent(popup, action) {
        var hideBy = popup.hideBy;
        if (hideBy) {
            each(hideBy, function (hideBy) {
                var target = Popup.hideBy[hideBy];
                if (target) {
                    target[action + 'Trigger'](popup);
                }
            });
        }
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
     * 存储当前触发元素的 key
     *
     * @inner
     * @type {string}
     */
    var currentTriggerKey = '__currentTrigger__';

    /**
     * 显示之前的拦截方法
     *
     * @inner
     * @param {Event=} event 触发事件
     */
    function onBeforeShow(event) {

        // 这里不能写下面这句代码：
        //
        // if (me.element.css('display') !== 'none') {
        //     return false;
        // }
        //
        // 因为当多个 trigger 公用一个弹出层时
        // 弹出层显示之后，可能又被另一个 trigger 触发显示
        // 这时仍然要走正常的显示流程

        var me = this;
        var element = me.element;

        // 可能出现多个 trigger 共用一个弹出层的情况
        var currentTrigger = element.data(currentTriggerKey);

        // 如果弹出元素当前处于显示状态
        if (currentTrigger) {

            // 无视重复触发显示
            if (event && currentTrigger.element === (event.toElement || event.target)) {
                return false;
            }

            // 如果是新的 trigger，则需隐藏旧的
            currentTrigger.hide();
        }

        var onBeforeShow = me.onBeforeShow;
        if (typeof onBeforeShow === 'function') {
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

        setTimeout(function () {
            // 异步调用要确保对象没有被销毁
            if (me.cache) {
                hideEvent(me, 'add');
            }
        }, 150);

        // 如果手动调用 show()，不会有事件
        if (event) {
            me.element.data(
                currentTriggerKey,
                {
                    element: event.toElement || event.target,
                    hide: $.proxy(me.hide, me)
                }
            );
        }

        var onAfterShow = me.onAfterShow;
        if (typeof onAfterShow === 'function') {
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

        if (me.element.css('display') === 'none') {
            return false;
        }

        var onBeforeHide = me.onBeforeHide;
        if (typeof onBeforeHide === 'function') {
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

        me.element.removeData(currentTriggerKey);
        hideEvent(me, 'remove');
        showEvent(me, 'add');

        var onAfterHide = me.onAfterHide;
        if (typeof onAfterHide === 'function') {
            onAfterHide.call(me.scope, event);
        }
    }

    /**
     * 延时执行
     *
     * @inner
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
            var removeBreaker = function () {
                cache.removeBreaker = null;
                clearDelay(popup);
                if (typeof condition.removeBreaker === 'function') {
                    condition.removeBreaker(popup, breaker);
                }
            };

            var breaker = function () {
                removeBreaker();
                clearDelay(popup);
            };

            cache.removeBreaker = removeBreaker;
            cache.delayTask = setTimeout(
                function () {
                    removeBreaker();
                    handler();
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

        // 调用 dispose 会把 popup.cache 置为 null
        // 异步必须检查一下
        if (cache && cache.delayTask) {
            clearTimeout(cache.delayTask);
            cache.delayTask = null;
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
            popup.showDelay,
            function () {
                popup.show(e);
            },
            Popup.showBy.focus
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
            popup.showDelay,
            function () {
                popup.show(e);
            },
            Popup.showBy.click
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
            popup.showDelay,
            function () {
                popup.show(e);
            },
            Popup.showBy.over
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
            if (isOutside(e.target, popup.element[0])) {
                setDelay(
                    popup,
                    popup.hideDelay,
                    function () {
                        popup.hide(e);
                    },
                    Popup.hideBy.blur
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

        if (isOutside(
                e.toElement,
                popup.trigger[0],
                popup.element[0])
        ) {
            setDelay(
                popup,
                popup.hideDelay,
                function () {
                    popup.hide(e);
                },
                Popup.hideBy.out
            );
        }
    }

    /**
     * target 是否在 arguments[1], arguments[2], ... 之外
     *
     * @inner
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
