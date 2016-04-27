/**
 * @file Popup
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 弹出式交互使用的非常普遍
     *
     * 抽象的说就是通过怎样的交互触发一个元素的显示，以及后续怎么隐藏它的问题
     *
     * ## 怎样触发显示
     *
     *    常见的触发方式包括：
     *
     *    focus 专用于输入框
     *    click
     *    enter
     *
     * ## 怎样触发隐藏
     *
     *    常见的触发方式包括：
     *
     *    blur 专用于输入框
     *    click （点击元素之外的地方触发隐藏）
     *    leave
     *
     * ## 延时
     *
     *    有时为了避免过于灵敏的触发，会设置 delay 来减少误操作
     *
     * ## 多种触发方式
     *
     *    比较常用的组合是 'leave,click'，即 鼠标移出 和 元素失焦 都会触发隐藏
     *
     *    如果没有隐藏延时，这个组合是不可能实现的，因为一旦移出，肯定是 leave 率先生效，click 等于没写
     *    如果设置隐藏延时，为了避免问题复杂化，需要把隐藏延时的方式写在首位
     *
     * ## 事件代理
     *
     *    当多个 triggerElement 共享一个 layerElement 元素时，可转为事件代理，而无需为每个 triggerElement 绑定事件
     *
     *
     */

    var isHidden = require('../function/isHidden');
    var contains = require('../function/contains');
    var nextTick = require('../function/nextTick');

    var lifeUtil = require('../util/life');
    var triggerUtil = require('../util/trigger');
    var instanceUtil = require('../util/instance');

    /**
     * 简单的弹出式交互
     *
     * 不涉及位置计算，仅包含显示/隐藏逻辑
     *
     * @constructor
     * @param {Object} options
     *
     * @property {jQuery=} options.triggerElement 触发元素，如果是调用方法显示，可不传
     * @property {string=} options.triggerSelector 如果传了选择器，表示为 triggerElement 的 triggerSelector 元素进行事件代理
     *                                             即触发了 triggerElement 中的 triggerSelector，会弹出 layerElement
     *
     * @property {jQuery|Function} options.layerElement 弹出的元素
     *
     * @property {boolean=} options.opened 弹出的元素是否默认展开。如果不传，会自动根据 DOM 判断
     *
     * @property {string=} options.showLayerTrigger 显示的触发方式，可选值有 click enter focus context，可组合使用，以逗号分隔
     * @property {number=} options.showLayerDelay 显示延时
     * @property {Function=} options.showLayerAnimation 显示动画
     *
     * @property {string} options.hideLayerTrigger 隐藏的触发方式，可选值有 click leave blur context，可组合使用，以逗号分隔
     * @property {number=} options.hideLayerDelay 隐藏延时
     * @property {Function} options.hideLayerAnimation 隐藏动画
     */
    function Popup(options) {
        lifeUtil.init(this, options);
    }

    var proto = Popup.prototype;

    proto.type = 'Popup';

    proto.init = function () {

        var me = this;

        var curry = function (proxy, name) {
            if ($.isFunction(proxy[ name ])) {
                return proxy[ name ](me);
            }
        };

        var showTriggers = triggerUtil.parse(
            me.option('showLayerTrigger'),
            function (trigger) {

                var showLayerTrigger = triggers.show[ trigger ];

                return {
                    delay: me.option('showLayerDelay'),
                    startDelay: curry(showLayerTrigger, 'startDelay'),
                    endDelay: curry(showLayerTrigger, 'endDelay'),
                    handler: curry(showLayerTrigger, 'handler'),
                    beforeHandler: function (e) {

                        var action = function () {
                            me.inner({
                                trigger: getTriggerElement(me, e),
                                layer: getLayerElement(me, e)
                            });
                        };

                        if (me.is('opened')) {

                            var promise = $.Deferred();
                            promise.then(action);

                            me.inner(HIDE_PROMISE_KEY, promise);

                            return promise;

                        }
                        else {
                            action();
                        }

                    }
                };

            }
        );

        var hideTriggers = triggerUtil.parse(
            me.option('hideLayerTrigger'),
            function (trigger) {

                var hideLayerTrigger = triggers.hide[ trigger ];

                return {
                    delay: me.option('hideLayerDelay'),
                    startDelay: curry(hideLayerTrigger, 'startDelay'),
                    endDelay: curry(hideLayerTrigger, 'endDelay'),
                    handler: curry(hideLayerTrigger, 'handler')
                };

            }
        );

        var showEvent = function (action) {
            $.each(
                showTriggers,
                function (trigger, config) {
                    triggers.show[ trigger ][ action ](me, config);
                }
            );
        };

        var hideEvent = function (action) {
            $.each(
                hideTriggers,
                function (trigger, config) {
                    triggers.hide[ trigger ][ action ](me, config);
                }
            );
        };







        var hasShowEvent = false;
        var hasHideEvent = false;

        var bindShowEvent = function () {
            if (!hasShowEvent) {
                showEvent('on');
                hasShowEvent = true;
            }
        };
        var unbindShowEvent = function () {
            if (hasShowEvent) {
                showEvent('off');
                hasShowEvent = false;
            }
        };
        var bindHideEvent = function () {
            if (!hasHideEvent) {
                hideEvent('on');
                hasHideEvent = true;
            }
        };
        var unbindHideEvent = function () {
            if (hasHideEvent) {
                hideEvent('off');
                hasHideEvent = false;
            }
        };
        var stateChangeHandler = function (e, data) {
            var opened = data.opened;
            if (opened) {
                if (opened.newValue) {
                    if (!me.option('triggerSelector')) {
                        unbindShowEvent();
                    }
                    nextTick(bindHideEvent);
                }
                else {
                    unbindHideEvent();
                    bindShowEvent();
                }
            }
        };

        me
        .before('dispose', function () {

            me.off('statechange', stateChangeHandler);

            unbindShowEvent();
            unbindHideEvent();

            me.close();

        })
        .on('statechange', stateChangeHandler);


        me.inner({
            trigger: getTriggerElement(me),
            layer: getLayerElement(me)
        });

        me.state({
            opened: me.option('opened')
        });

    };


    proto.open = function () {
        this.state('opened', true);
    };

    proto._open = function (e) {

        var me = this;

        if (me.is('opened')) {

            var layerElement = me.inner('layer');

            // 多个 triggerElement 触发同一个 layerElement 时
            // 不同的 triggerElement 触发 open，需要先 close 之前的
            var currTriggerElement = me.inner('trigger');
            var prevTriggerElement = layerElement.data(TRIGGER_ELEMENT_KEY);

            if (currTriggerElement
                && prevTriggerElement
                && currTriggerElement[0] !== prevTriggerElement[0]
            ) {
                layerElement.data(POPUP_KEY).close();
                nextTick(function () {
                    if (me.guid) {
                        me.open(e);
                    }
                });
            }

            return false;
        }

        return {
            dispatch: true
        };

    };

    proto.open_ = function () {

        var me = this;

        var layerElement = me.inner('layer');
        if (layerElement) {

            var data = { };
            data[ TRIGGER_ELEMENT_KEY ] = me.inner('trigger');
            data[ POPUP_KEY ] = me;

            layerElement.data(data);
        }

        return {
            dispatch: true
        };

    };


    proto.close = function () {
        this.state('opened', false);
    };

    proto._close = function () {
        if (!this.is('opened')) {
            return false;
        }
        return {
            dispatch: true
        };
    };
    proto.close_ = function () {
        var me = this;
        var layerElement = me.inner('layer');
        if (layerElement) {
            layerElement
                .removeData(POPUP_KEY)
                .removeData(TRIGGER_ELEMENT_KEY);
        }
        return {
            dispatch: true
        };
    };

    proto.dispose = function () {
        lifeUtil.dispose(this);
    };

    lifeUtil.extend(proto);

    Popup.stateUpdater = {
        opened: function (opened) {
            var layerElement = this.inner('layer');
            if (layerElement) {
                this.execute(
                    opened ? 'showLayerAnimation' : 'hideLayerAnimation',
                    {
                        layerElement: layerElement
                    }
                );
            }
        }
    };

    Popup.stateValidator = {
        opened: function (opened) {
            if ($.type(opened) !== 'boolean') {
                var layerElement = this.inner('layer');
                if (layerElement) {
                    opened = !isHidden(layerElement);
                }
            }
            return opened;
        }
    };

    /**
     * 创建响应 show 事件的事件处理函数
     *
     * @inner
     * @param {Popup} instance
     * @param {Function=} before 需要满足什么前置条件才可往下执行
     * @return {Function}
     */
    function createShowHandler(instance, before) {
        return function (e) {

            var target = $(this);
            if (target.attr('disabled') === 'disabled') {
                return;
            }

            if ($.isFunction(before)) {
                if (!before.call(this, e)) {
                    return;
                }
            }

            instance.open(e);

        };
    }

    /**
     * 创建响应 hide 事件的事件处理函数
     *
     * @inner
     * @param {Popup} instance
     * @param {Function=} before 需要满足什么前置条件才可往下执行
     * @return {Function}
     */
    function createHideHandler(instance, before) {
        return function (e) {

            var target = $(this);
            if (target.attr('disabled') === 'disabled') {
                return;
            }

            if ($.isFunction(before)) {
                if (!before.call(this, e)) {
                    return;
                }
            }

            instance.close(e);

            var promise = instance.inner(HIDE_PROMISE_KEY);
            if (promise) {
                instance.sync();
                promise.resolve();
            }

        };
    }

    function onElement(element, type, handler, selector) {
        if (element) {
            element.on(type, selector, handler);
        }
    }

    function offElement(element, type, handler) {
        if (element) {
            element.off(type, handler);
        }
    }

    /**
     * 通用的绑定事件
     *
     * @inner
     * @param {Object} instance
     * @param {Object} config
     */
    function onTrigger(instance, config) {
        var triggerElement = instance.option('triggerElement');
        var triggerSelector = instance.option('triggerSelector');
        if (triggerElement || triggerSelector) {
            onElement(
                triggerElement || instanceUtil.body,
                config.type,
                config.handler,
                triggerSelector
            );
        }
    }

    /**
     * 通用的解绑事件
     *
     * @inner
     * @param {Object} instance
     * @param {Object} config
     */
    function offTrigger(instance, config) {
        offElement(
            instance.option('triggerElement') || instanceUtil.body,
            config.type,
            config.handler
        );
    }

    /**
     * 在 document 绑定全局事件
     *
     * @inner
     * @param {Popup} instance
     * @param {Object} config
     */
    function onDocument(instance, config) {
        onElement(
            instanceUtil.document,
            config.type,
            config.handler
        );
    }

    /**
     * 取消全局绑定
     *
     * @inner
     * @param {Popup} instance
     * @param {Object} config
     */
    function offDocument(instance, config) {
        offElement(
            instanceUtil.document,
            config.type,
            config.handler
        );
    }

    /**
     * 创建响应 hide 失焦的事件处理函数
     *
     * @inner
     * @param {Popup} instance
     * @return {Function}
     */
    function createDocumentHideHandler(instance) {
        return createHideHandler(
            instance,
            function (e) {
                return !contains(
                    instance.inner('layer'),
                    e.target
                );
            }
        );
    }

    function getTriggerElement(instance, event) {
        var triggerElement = instance.option('triggerElement');
        var triggerSelector = instance.option('triggerSelector');
        if (triggerElement && !triggerSelector) {
            return triggerElement;
        }
        if (event) {
            return $(event.currentTarget);
        }
    }

    function getLayerElement(instance, event) {
        var layerElement = instance.option('layerElement');
        if (layerElement && layerElement.jquery && layerElement.length) {
            return layerElement;
        }
        if (event && $.isFunction(layerElement)) {
            layerElement = instance.execute(layerElement, event);
            if (layerElement && layerElement.tagName) {
                layerElement = $(layerElement);
            }
            return layerElement;
        }
    }

    var POPUP_KEY = '__prev_popup__';
    var TRIGGER_ELEMENT_KEY = '__trigger_element__';
    var HIDE_PROMISE_KEY = '__hide_promise__';

    var enterType = triggerUtil.enter.type;
    var leaveType = triggerUtil.leave.type;

    /**
     * show/hide 配置
     *
     * @inner
     * @type {Object}
     */
    var triggers = {

        show: {
            focus: {
                on: onTrigger,
                off: offTrigger,
                handler: createShowHandler
            },
            click: {
                on: onTrigger,
                off: offTrigger,
                handler: createShowHandler
            },
            enter: {
                on: onTrigger,
                off: offTrigger,
                handler: createShowHandler,
                startDelay: function (instance) {
                    return function (handler) {
                        onElement(
                            instance.inner('trigger'),
                            leaveType,
                            handler
                        );
                    };
                },
                endDelay: function (instance) {
                    return function (handler) {
                        offElement(
                            instance.inner('trigger'),
                            leaveType,
                            handler
                        );
                    };
                }
            },
            context: {
                on: onTrigger,
                off: offTrigger,
                handler: createShowHandler
            }
        },

        hide: {
            blur: {
                on: onTrigger,
                off: offTrigger,
                handler: createHideHandler
            },
            click: {
                on: onDocument,
                off: offDocument,
                handler: createDocumentHideHandler
            },
            leave: {
                on: function (instance, config) {

                    onElement(
                        instance.inner('trigger'),
                        config.type,
                        config.handler
                    );

                    onElement(
                        instance.inner('layer'),
                        config.type,
                        config.handler
                    );

                },
                off: function (instance, config) {

                    offElement(
                        instance.inner('trigger'),
                        config.type,
                        config.handler
                    );

                    offElement(
                        instance.inner('layer'),
                        config.type,
                        config.handler
                    );

                },
                handler: createHideHandler,
                startDelay: function (instance) {
                    return function (handler) {

                        onElement(
                            instance.inner('trigger'),
                            enterType,
                            handler
                        );

                        onElement(
                            instance.inner('layer'),
                            enterType,
                            handler
                        );

                    };
                },
                endDelay: function (instance) {
                    return function (handler) {

                        offElement(
                            instance.inner('trigger'),
                            enterType,
                            handler
                        );

                        offElement(
                            instance.inner('layer'),
                            enterType,
                            handler
                        );

                    };
                }
            },
            context: {
                on: onDocument,
                off: offDocument,
                handler: createDocumentHideHandler
            }
        }

    };


    return Popup;

});
