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
     *    click （点击元素之外的地方触发隐藏）
     *    out ( mouseout 简写 )
     *
     * #延时#
     *
     *    有时为了避免过于灵敏的触发，会设置 delay 来减少误操作
     *
     * #多种触发方式#
     *
     *    比较常用的组合是 'out,click'，即 鼠标移出 和 元素失焦 都会触发隐藏
     *
     *    如果没有隐藏延时，这个组合是不可能实现的，因为一旦移出，肯定是 out 率先生效，click 等于没写
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
     *        on: function (popup) { },             // 传入 popup 实例，绑定触发事件
     *        off: function (popup) { },            // 传入 popup 实例，解绑触发事件
     *        handler: function (e) { }
     *    }
     *
     *    构造函数的 show.trigger 可选的值取决于 Popup.trigger.show 的键值
     *
     *    理论上来说，每种触发方式都能配置 delay，但从需求上来说，不可能存在这种情况
     *
     *    在配置 delay 时，只作用于第一个触发方式，
     *    如 trigger.show 配置为 'over,click'，只有 over 才会 delay
     *
     * #事件代理#
     *
     *    当多个 element 共享一个 layer 元素时，可转为事件代理，而无需为每个 element 绑定事件
     *
     */

    'use strict';

    var split = require('../function/split');
    var isHidden = require('../function/isHidden');
    var contains = require('../function/contains');
    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var instance = require('../util/instance');

    /**
     * 简单的弹出式交互
     *
     * 不涉及位置计算，仅包含显示/隐藏逻辑
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.element 触发的元素，如果是调用方法触发显示，可不传
     * @property {jQuery} options.layer 弹出的元素
     *
     * @property {string=} options.selector 如果传了选择器，表示为 element 的 selector 元素进行事件代理
     *
     * @property {Object} options.show
     * @property {string=} options.show.trigger 显示的触发方式，可选值有 click over focus context，可组合使用，以逗号分隔
     * @property {number=} options.show.delay 显示延时
     * @property {Function=} options.show.animation 显示动画，如果未设置，默认是 layer.show()
     *
     * @property {Object} options.hide
     * @property {string=} options.hide.trigger 隐藏的触发方式，可选值有 click out blur context，可组合使用，以逗号分隔
     * @property {number=} options.hide.delay 隐藏延时
     * @property {Function=} options.hide.animation 隐藏动画，如果未设置，默认是 layer.hide()
     *
     * @property {Function=} options.onBeforeShow 返回 false 可阻止显示
     * @property {Function=} options.onAfterShow
     * @property {Function=} options.onBeforeHide 返回 false 可阻止隐藏
     * @property {Function=} options.onAfterHide
     *
     */
    function Popup(options) {
        return lifeCycle.init(this, options);
    }

    Popup.prototype = {

        constructor: Popup,

        type: 'Popup',

        /**
         * 初始化
         */
        init: function () {

            var me = this;

            var showConfigList =
            me.showConfigList = [ ];

            var hideConfigList =
            me.hideConfigList = [ ];

            var showTrigger = me.show.trigger;
            var hideTrigger = me.hide.trigger;

            if (showTrigger) {
                $.each(
                    split(showTrigger, ','),
                    function (index, trigger) {

                        var config = Popup.trigger.show[ trigger ];

                        if (config) {
                            showConfigList.push(config);
                        }

                    }
                );
            }

            if (hideTrigger) {
                $.each(
                    split(me.hide.trigger, ','),
                    function (index, trigger) {

                        var config = Popup.trigger.hide[ trigger ];

                        if (config) {
                            hideConfigList.push(config);
                        }
                    }
                );
            }

            var hidden = me.hidden
                       = isHidden(me.layer);

            var action = hidden ? showEvent : hideEvent;
            action(me, 'on');
        },

        /**
         * 显示
         */
        open: function () {

            var me = this;

            var event = arguments[0];

            // 手动调用需设置时间戳
            if (!event) {
                me[ lastTriggerTimeKey ] = getTimeStamp();
            }

            event = onBeforeShow(me, event);

            if (event.isDefaultPrevented()) {
                return;
            }

            var layer = me.layer;

            var animation = me.show.animation;
            if ($.isFunction(animation)) {
                animation.call(me, layer);
            }
            else {
                layer.show();
            }

            me.hidden = false;

            onAfterShow(me, event);
        },

        /**
         * 隐藏
         */
        close: function () {

            var me = this;

            if (me.hidden) {
                return;
            }

            var event = arguments[0];

            // 手动调用需设置时间戳
            if (!event) {
                me[ lastTriggerTimeKey ] = getTimeStamp();
            }

            event = onBeforeHide(me, event);

            if (event.isDefaultPrevented()) {
                return;
            }

            var layer = me.layer;

            var animation = me.hide.animation;
            if ($.isFunction(animation)) {
                animation.call(me, layer);
            }
            else {
                layer.hide();
            }

            me.hidden = true;

            onAfterHide(me);
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.close();

            showEvent(me, 'off');

            me.element =
            me.layer = null;
        }
    };

    jquerify(Popup.prototype);


    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Popup.defaultOptions = {
        show: { trigger: 'click' },
        hide: { trigger: 'click' }
    };



    /**
     * 处理 显示事件
     *
     * @inner
     * @param {Popup} popup
     * @param {string} action 可选值有 on off
     */
    function showEvent(popup, action) {
        $.each(
            popup.showConfigList,
            function (index, config) {
                config[action](popup);
            }
        );
    }

    /**
     * 处理 隐藏事件
     *
     * @inner
     * @param {Popup} popup
     * @param {string} action 可选值有 on off
     */
    function hideEvent(popup, action) {
        $.each(
            popup.hideConfigList,
            function (index, config) {
                config[action](popup);
            }
        );
    }

    /**
     * 隐藏事件响应后触发的 promise
     *
     * 因为有时 show 会先于 hide 触发，我们通过 Promise 控制触发顺序为 hide -> show
     *
     * @inner
     * @type {string}
     */
    var hidePromiseKey = '__hidePromise__';

    /**
     * 显示延时的定时器名称
     *
     * @inner
     * @type {string}
     */
    var showTimerKey = '__showTimer__';

    /**
     * 显示延时的处理函数名称
     *
     * @inner
     * @type {string}
     */
    var showTimerHandlerKey = '__showTimerHandler__';

    /**
     * 隐藏延时的定时器名称
     *
     * @inner
     * @type {string}
     */
    var hideTimerKey = '__hideTimer__';

    /**
     * 隐藏延时的处理函数名称
     *
     * @inner
     * @type {string}
     */
    var hideTimerHandlerKey = '__hideTimerHandler__';

    /**
     * 上一次的 trigger 时间戳名称
     *
     * @inner
     * @type {string}
     */
    var lastTriggerTimeKey = '__lastTriggerTime__';

    /**
     * 触发显示的源元素名称
     *
     * @inner
     * @type {string}
     */
    var sourceElementKey = '__sourceElement__';

    /**
     * 修改 event 的 type 值
     *
     * @inner
     * @param {Event} event
     * @param {string} type
     * @return {Event|string}
     */
    function getEvent(event, type) {
        if (event) {
            event.type = type;
        }
        else {
            event = type;
        }
        return event;
    }

    function getSourceElement(e) {
        var element = e.currentTarget;
        return element && element.tagName === 'HTML' ? null : element;
    }

    /**
     * 显示之前的拦截方法
     *
     * @inner
     * @param {Popup} popup
     * @param {Event=} event 触发事件
     */
    function onBeforeShow(popup, event) {
        return popup.emit(
            getEvent(event, 'beforeShow')
        );
    }

    /**
     * 显示完之后需要绑定事件触发隐藏逻辑
     *
     * @inner
     * @param {Popup} popup
     * @param {Event=} event 触发事件
     */
    function onAfterShow(popup, event) {

        popup.layer.data(
            sourceElementKey,
            getSourceElement(event)
        );

        showEvent(popup, 'off');
        hideEvent(popup, 'on');

        return popup.emit('afterShow');

    }

    /**
     * 隐藏之前要确保元素是显示状态的
     *
     * @inner
     * @param {Popop} popup
     * @param {Event=} event
     */
    function onBeforeHide(popup, event) {
        return popup.emit(
            getEvent(event, 'beforeHide')
        );
    }

    /**
     * 隐藏之后需要解绑事件
     *
     * @inner
     * @param {Popup} popup
     */
    function onAfterHide(popup) {

        popup.layer.removeData(
            sourceElementKey
        );

        hideEvent(popup, 'off');
        showEvent(popup, 'on');

        return popup.emit('afterHide');

    }






    /**
     * 获取事件产生时的时间戳
     *
     * @inner
     * @param {Event} e
     * @return {number}
     */
    function getTimeStamp(e) {
        // e.timeStamp 在火狐下取值是错的
        // 为了避免碰到更多 SB 浏览器
        // 这里就用 $.now
        return $.now();
    }

    function getEventHandlerName(type) {
        return '__' + type + 'Handler' + '__';
    }

    // 下面四个 check 要按顺序执行

    function checkTimer(popup, name) {
        return popup[ name ] == null;
    }

    function checkSourceElement(popup, e) {
        return popup.layer.data(sourceElementKey) !== getSourceElement(e);
    }

    function checkBeforeCondition(popup, before, e) {
        return !before || before(popup, e);
    }

    function checkTimeInterval(popup, eventTime) {
        return eventTime - popup[ lastTriggerTimeKey ] > 50;
    }

    /**
     * 创建响应 show 事件的事件处理函数
     *
     * @inner
     * @param {string} trigger 触发显示的方式，如 click
     * @param {Function=} before 需要满足什么前置条件才可往下执行
     * @return {Function}
     */
    function createShowHandler(trigger, before) {
        return function (e) {

            var popup = e.data;

            var eventTime = getTimeStamp(e);

            if (!checkTimer(popup, showTimerKey)
                || !checkSourceElement(popup, e)
                || !checkBeforeCondition(popup, before, e)
            ) {
                return;
            }

            popup[ lastTriggerTimeKey ] = eventTime;

            /**
             * 难点是当 layer 处于显示状态时，另一个触发显示的 dom 事件也走进这里。
             *
             * 举个例子：
             *
             * 当点击 a 元素显示 layer 时，这时会等待元素失焦隐藏（document 监听 click）。
             *
             * 这时分两种情况：
             *
             * 1. 点击 a 元素 => 隐藏 layer
             *
             * 2. 点击 b 元素 => 显示 layer（实际上是先隐藏再显示）
             *
             * 这里不能考虑 after show 之后解绑 a 的 show 事件，因为使用事件代理时，肯定是不能这样做的。
             *
             * 因此只能在这个函数中解决，我的思路如下：
             *
             * 1. 当 layer 隐藏时，显示 layer
             * 2. 当 layer 显示时，如果触发元素跟上一个相同，则隐藏 layer
             * 3. 当 layer 显示时，如果触发元素跟上一个不同，则隐藏再显示 layer
             *
             * 对于 2 和 3，因为存在类似 document 监听 click 这种事件冒泡逻辑，
             * 所以需要在事件冒泡到 document 之后再响应，这里考虑使用 promise 会比较优雅
             *
             */

            delayExecute({
                popup: popup,
                delay: popup.show.delay,
                toggle: Popup.trigger.show[ trigger ].delay,
                timer: showTimerKey,
                timerHandler: showTimerHandlerKey,
                success: function () {

                    var fn = function () {
                        popup.open(e);
                    };

                    var promise = popup[ hidePromiseKey ];

                    if (promise) {
                        promise.done(fn);
                    }
                    else {
                        fn();
                    }

                }
            });


        };
    }

    /**
     * 创建响应 hide 事件的事件处理函数
     *
     * @inner
     * @param {string} trigger 触发显示的方式，如 click
     * @param {Function=} before 需要满足什么前置条件才可往下执行
     * @return {Function}
     */
    function createHideHandler(trigger, before) {
        return function (e) {

            var popup = e.data;

            var eventTime = getTimeStamp(e);

            if (!checkTimer(popup, hideTimerKey)
                || !checkBeforeCondition(popup, before, e)
                || !checkTimeInterval(popup, eventTime)
            ) {
                return;
            }

            popup[ lastTriggerTimeKey ] = eventTime;
            popup[ hidePromiseKey ] = $.Deferred();

            delayExecute({
                popup: popup,
                delay: popup.hide.delay,
                toggle: Popup.trigger.hide[ trigger ].delay,
                timer: hideTimerKey,
                timerHandler: hideTimerHandlerKey,
                success: function () {

                    popup.close(e);

                    popup[ hidePromiseKey ].resolve();

                },
                fail: function () {
                    popup[ hidePromiseKey ] = null;
                }
            });

        };
    }

    /**
     * 延时执行
     *
     * @inner
     * @param {Object} options
     * @property {Popup} popup 实例对象
     * @property {number} delay 延时时间
     * @property {string} timer 定时器名称
     * @property {string} timerHandler 定时器执行函数名称
     * @property {Object} toggle
     * @property {Function} success
     * @property {Function} fail
     */
    function delayExecute(options) {

        var delay = options.delay;
        var success = options.success;

        if (delay > 0) {

            var popup = options.popup;
            var timer = options.timer;
            var timerHandler = options.timerHandler;

            var toggle = options.toggle || { };
            var on = toggle.on || $.noop;
            var off = toggle.off || $.noop;
            var fail = options.fail || $.noop;

            var clearTimer = function () {

                clearTimeout(popup[ timer ]);
                off(popup, popup[ timerHandler ]);

                popup[ timer ] =
                popup[ timerHandler ] = null;

            };

            var fn = function (value) {

                var hasTimer = popup[ timer ];

                if (hasTimer) {
                    clearTimer();
                }

                if (hasTimer && value === lastTriggerTimeKey) {
                    success();
                }
                else {
                    fail();
                }

            };


            popup[ timerHandler ] = on(popup, fn);

            popup[ timer ] = setTimeout(
                function () {
                    fn(lastTriggerTimeKey);
                },
                delay
            );

        }
        else {
            success();
        }
    }

    function on(popup) {

        var me = this;

        var type = me.type;
        var handler = me.handler;

        var handlerName = getEventHandlerName(type);

        if (popup[ handlerName ] !== handler) {
            popup.element.on(type, popup.selector, popup, handler);
            popup[ handlerName ] = handler;
        }

    }

    function off(popup) {

        var me = this;

        if (!popup.selector) {

            var type = me.type;

            popup.element.off(type, me.handler);
            popup[ getEventHandlerName(type) ] = null;

        }

    }

    var inElement = function (popup, target) {

        if (!target) {
            return false;
        }

        var selector = popup.selector;
        if (selector) {

            var element = popup.layer.data(sourceElementKey);
            if (element) {
                return contains(element, target);
            }

            if (!target.jquery) {
                target = $(target);
            }

            var tagName = target.prop('tagName').toLowerCase();
            return target.is(selector)
                || target.is(selector + ' ' + tagName);
        }
        else {
            return contains(popup.element, target);
        }
    };

    var inLayer = function (popup, target) {
        if (!target) {
            return false;
        }
        return contains(popup.layer, target);
    };


    Popup.trigger = {

        show: {
            focus: {
                type: 'focusin',
                handler: createShowHandler('focus'),
                on: on,
                off: off
            },
            click: {
                type: 'click',
                handler: createShowHandler('click'),
                on: on,
                off: off
            },
            over: {
                type: 'mouseenter',
                handler: createShowHandler('over'),
                on: on,
                off: off,
                delay: {
                    on: function (popup, fn) {

                        var handler = function (e) {
                            if (!inElement(popup, e.toElement)) {
                                fn();
                            }
                        };

                        popup.element.on('mouseleave', popup.selector, handler);

                        return handler;
                    },
                    off: function (popup, fn) {
                        popup.element.off('mouseleave', fn);
                    }
                }
            },
            context: {
                type: 'contextmenu',
                handler: createShowHandler('context'),
                on: on,
                off: off
            }
        },

        hide: {
            blur: {
                type: 'focusout',
                handler: createHideHandler('blur'),
                on: on,
                off: off
            },
            click: {
                type: 'click',
                handler: function () {
                    return createHideHandler(
                        this.type,
                        function (popup, e) {
                            return !inLayer(popup, e.target);
                        }
                    );
                },
                on: function (popup) {

                    var me = this;

                    instance.document.on(
                        me.type,
                        popup,
                        popup.clickHandler = me.handler()
                    );

                },
                off: function (popup) {
                    instance.document.off(this.type, popup.clickHandler);
                }
            },
            out: {
                type: 'mouseleave',
                handler: createHideHandler(
                    'out',
                    function (popup, e) {

                        var target = e.toElement;

                        // 用 jasmine 测试时，target 可能为 null
                        if (!target) {
                            return true;
                        }

                        return !inElement(popup, target) && !inLayer(popup, target);
                    }
                ),
                on: function (popup) {

                    var type = this.type;
                    var handler = this.handler;

                    popup.layer.on(type, popup, handler);
                    popup.element.on(type, popup.selector, popup, handler);

                },
                off: function (popup) {
                    var type = this.type;
                    var handler = this.handler;
                    popup.element.off(type, handler);
                    popup.layer.off(type, handler);
                },
                delay: {
                    on: function (popup, fn) {

                        var handler = function (e) {
                            var target = e.toElement;
                            if (inElement(popup, target) || inLayer(popup, target)) {
                                fn();
                            }
                        };

                        popup.element.on('mouseenter', popup.selector, handler);
                        popup.layer.on('mouseenter', handler);

                        return handler;

                    },
                    off: function (popup, fn) {
                        popup.element.off('mouseenter', fn);
                        popup.layer.off('mouseenter', fn);
                    }
                }
            },
            context: {
                type: 'contextmenu',
                handler: function () {
                    return createHideHandler(
                        'context',
                        function (popup, e) {
                            return !inLayer(popup, e.target);
                        }
                    );
                },
                on: function (popup) {

                    var me = this;

                    instance.document.on(
                        me.type,
                        popup,
                        popup.contextHandler = me.handler()
                    );
                },
                off: function (popup) {
                    instance.document.off(this.type, popop.contextHandler);
                }
            }
        }

    };

    return Popup;

});
