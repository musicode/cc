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
     */

    'use strict';

    var split = require('../function/split');
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

            var show = me.show;
            var hide = me.hide;

            me.cache = {

                showTrigger: show.trigger
                           ? split(show.trigger, ',')
                           : [ ],

                hideTrigger: hide.trigger
                           ? split(hide.trigger, ',')
                           : [ ]
            };

            var hidden = me.hidden
                       = me.layer.is(':hidden');

            var action = hidden ? showEvent : hideEvent;
            action(me, 'on');
        },

        /**
         * 显示
         */
        open: function () {

            var me = this;

            var event = onBeforeShow(me, arguments[0]);

            if (event.isDefaultPrevented()) {
                return;
            }

            var animation = me.show.animation;
            if ($.isFunction(animation)) {
                animation.call(me);
            }
            else {
                me.layer.show();
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

            var event = onBeforeHide(me, arguments[0]);

            if (event.isDefaultPrevented()) {
                return;
            }

            var animation = me.hide.animation;
            if ($.isFunction(animation)) {
                animation.call(me);
            }
            else {
                me.layer.hide();
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
            me.layer =
            me.cache = null;
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
        show: { },
        hide: { }
    };


    function showFactory(trigger, before) {
        return function (e) {

            var popup = e.data;
            var cache = popup.cache;

            if (!$.isFunction(before) || before(popup, e)) {
                setDelay(
                    popup,
                    popup.show.delay,
                    showDelay[trigger] || { },
                    function () {
                        cache.timeStamp = e.timeStamp || +new Date();
                        cache.showBy = trigger;
                        popup.open(e);
                    }
                );
            }
        };
    }

    function hideFactory(trigger, before) {
        return function (e) {

            var popup = e.data;
            var cache = popup.cache;
            var timeStamp = e.timeStamp || +new Date();

            if (cache.showBy === trigger
                && timeStamp - cache.timeStamp < 50
            ) {
                return;
            }

            if (!$.isFunction(before) || before(popup, e)) {
                setDelay(
                    popup,
                    popup.hide.delay,
                    hideDelay[trigger] || { },
                    function () {
                        cache.timeStamp = timeStamp;
                        cache.hideBy = trigger;
                        popup.close(e);
                    }
                );
            }
        };
    }

    var showTrigger = {
        focus: {
            on: function (popup) {
                popup.element.on('focus', popup, showTrigger.focus.handler);
            },
            off: function (popup) {
                popup.element.off('focus', showTrigger.focus.handler);
            },
            handler: showFactory('focus')
        },

        click: {
            on: function (popup) {
                popup.element.on('click', popup, showTrigger.click.handler);
            },
            off: function (popup) {
                popup.element.off('click', showTrigger.click.handler);
            },
            handler: showFactory('click')
        },

        over: {
            on: function (popup) {
                popup.element.on('mouseenter', popup, showTrigger.over.handler);
            },
            off: function (popup) {
                popup.element.off('mouseenter', showTrigger.over.handler);
            },
            handler: showFactory('over')
        },
        context: {
            on: function (popup) {
                popup.element.on('contextmenu', popup, showTrigger.context.handler);
            },
            off: function (popup) {
                popup.element.off('contextmenu', showTrigger.context.handler);
            },
            handler: showFactory('context')
        }
    };

    var hideTrigger = {
        blur: {
            on: function (popup) {
                popup.element.on('blur', popup, hideTrigger.blur.handler);
            },
            off: function (popup) {
                popup.element.off('blur', hideTrigger.blur.handler);
            },
            handler: hideFactory('blur')
        },

        click: {
            on: function (popup) {
                instance.document.on(
                    'click',
                    popup,
                    popup.cache.clickHandler = hideTrigger.click.handler()
                );
            },
            off: function (popup) {
                var cache = popup.cache;
                instance.document.off('click', cache.clickHandler);
                cache.clickHandler = null;
            },
            handler: function () {
                return hideFactory(
                    'click',
                    function (popup, e) {
                        return !contains(popup.layer, e.target);
                    }
                );
            }
        },

        out: {
            on: function (popup) {
                var handler = hideTrigger.out.handler;
                popup.element.on('mouseleave', popup, handler);
                popup.layer.on('mouseleave', popup, handler);
            },
            off: function (popup) {
                var handler = hideTrigger.out.handler;
                popup.element.off('mouseleave', handler);
                popup.layer.off('mouseleave', handler);
            },
            handler: hideFactory(
                'out',
                function (popup, e) {
                    var target = e.relatedTarget;
                    // 用 jasmine 测试时，target 可能为 null
                    return target == null
                         ? true
                         : !contains(popup.element, target)
                         && !contains(popup.layer, target);
                }
            )
        },
        context: {
            on: function (popup) {
                instance.document.on(
                    'contextmenu',
                    popup,
                    popup.cache.contextHandler = hideTrigger.context.handler()
                );
            },
            off: function (popup) {
                var cache = popup.cache;
                instance.document.off('contextmenu', cache.contextHandler);
                cache.contextHandler = null;
            },
            handler: function () {
                return hideFactory(
                    'context',
                    function (popup, e) {
                        return !contains(popup.layer, e.target);
                    }
                );
            }
        }
    };

    var showDelay = {
        over: {
            on: function (popup, fn) {
                popup.element.on('mouseleave', fn);
            },
            off: function (popup, fn) {
                popup.element.off('mouseleave', fn);
            }
        }
    };

    var hideDelay = {
        out: {
            on: function (popup, fn) {
                popup.element.on('mouseenter', fn);
                popup.layer.on('mouseenter', fn);
            },
            off: function (popup, fn) {
                popup.element.off('mouseenter', fn);
                popup.layer.off('mouseenter', fn);
            }
        }
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
            popup.cache.showTrigger,
            function (index, name) {
                showTrigger[name][action](popup);
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
            popup.cache.hideTrigger,
            function (index, name) {
                hideTrigger[name][action](popup);
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

    function getEvent(event, type) {
        if (event) {
            event.type = type;
        }
        else {
            event = type;
        }
        return event;
    }

    /**
     * 显示之前的拦截方法
     *
     * @inner
     * @param {Popup} popup
     * @param {Event=} event 触发事件
     */
    function onBeforeShow(popup, event) {

        var layer = popup.layer;

        // 触发元素（mousenter 和 mouseleave 都有 target 元素，试了几次还比较可靠）
        var target = popup.cache.target
                   = event && event.target;

        // 可能出现多个 element 共用一个弹出层的情况
        var currentSource = layer.data(currentSourceKey);

        // 如果弹出元素当前处于显示状态
        if (currentSource) {

            // 无视重复触发显示
            if (currentSource.layer === target) {
                return false;
            }

            // 如果是新的 source 则需隐藏旧的
            currentSource.close();
        }

        return popup.emit(
            getEvent(event, 'beforeShow')
        );
    }

    /**
     * 显示完之后需要绑定事件触发隐藏逻辑
     *
     * @inner
     * @param {Popup} popup
     */
    function onAfterShow(popup) {

        showEvent(popup, 'off');
        hideEvent(popup, 'on');

        var target = popup.cache.target;
        if (target) {
            popup.layer.data(
                currentSourceKey,
                {
                    element: target,
                    close: $.proxy(popup.close, popup)
                }
            );
        }

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

        popup.layer.removeData(currentSourceKey);

        hideEvent(popup, 'off');
        showEvent(popup, 'on');

        return popup.emit('afterHide');

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

            var on = condition.on;
            var off = condition.off;

            var fn = function () {
                if (clearDelay(popup)) {
                    if ($.isFunction(off)) {
                        off(popup, fn);
                    }
                    return true;
                }
            };

            cache.delayTimer = setTimeout(
                                    function () {
                                        if (fn()) {
                                            handler();
                                        }
                                    },
                                    time
                                );

            if ($.isFunction(on)) {
                on(popup, fn);
            }
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


    return Popup;

});
