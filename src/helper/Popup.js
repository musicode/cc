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
     *    如果设置隐藏延时，为了避免问题复杂化，需要把隐藏延时的方式写在首位（后面会说理由）
     *
     * ## 可配置的触发方式
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
     *    如 trigger.show 配置为 'enter,click'，只有 enter 才会 delay
     *
     * ## 事件代理
     *
     *    当多个 element 共享一个 layer 元素时，可转为事件代理，而无需为每个 element 绑定事件
     *
     *
     */

    var call = require('../function/call');
    var split = require('../function/split');
    var isHidden = require('../function/isHidden');
    var contains = require('../function/contains');
    var lifeCycle = require('../function/lifeCycle');
    var instance = require('../util/instance');
    var trigger = require('../util/trigger');

    /**
     * 简单的弹出式交互
     *
     * 不涉及位置计算，仅包含显示/隐藏逻辑
     *
     * @constructor
     * @param {Object} options
     *
     * @property {jQuery=} options.triggerElement 触发的元素，如果是调用方法触发显示，可不传
     * @property {string=} options.triggerSelector 如果传了选择器，表示为 triggerElement 的 triggerSelector 元素进行事件代理
     *                                             即触发了 triggerElement 中的 triggerSelector，会弹出 layerElement
     *
     * @property {jQuery} options.layerElement 弹出的元素
     *
     * @property {string=} options.showLayerTrigger 显示的触发方式，可选值有 click enter focus context，可组合使用，以逗号分隔
     * @property {number=} options.showLayerDelay 显示延时
     * @property {Function=} options.showLayerAnimate 显示动画，如果未设置，默认是 layerElement.show()
     *
     * @property {string=} options.hideLayerTrigger 隐藏的触发方式，可选值有 click leave blur context，可组合使用，以逗号分隔
     * @property {number=} options.hideLayerDelay 隐藏延时
     * @property {Function=} options.hideLayerAnimate 隐藏动画，如果未设置，默认是 layerElement.hide()
     *
     */
    function Popup(options) {
        lifeCycle.init(this, options);
    }

    var proto = Popup.prototype;

    proto.type = 'Popup';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        var execute = function (proxy, name) {
            if ($.isFunction(proxy[ name ])) {
                return proxy[ name ](me);
            }
        };

        me.inner({
            showConfigs: trigger.parse(
                me.option('showLayerTrigger'),
                function (trigger) {

                    var showLayerTrigger = triggers.show[ trigger ];

                    return {
                        delay: me.option('showLayerDelay'),
                        startDelay: execute(showLayerTrigger, 'startDelay'),
                        endDelay: execute(showLayerTrigger, 'endDelay'),
                        handler: execute(showLayerTrigger, 'handler')
                    };

                }
            ),
            hideConfigs: trigger.parse(
                me.option('hideLayerTrigger'),
                function (trigger) {

                    var hideLayerTrigger = triggers.hide[ trigger ];

                    return {
                        delay: me.option('hideLayerDelay'),
                        startDelay: execute(hideLayerTrigger, 'startDelay'),
                        endDelay: execute(hideLayerTrigger, 'endDelay'),
                        handler: execute(hideLayerTrigger, 'handler')
                    };

                }
            )
        });



        var hasShowEvent = false;
        var hasHideEvent = false;

        me.getContext()
        .before('open', function () {
            if (!hasShowEvent && hasHideEvent) {
                return false;
            }
        })
        .after('open', function (e) {

            // 解绑 show event
            if (hasShowEvent) {
                if (!me.option('triggerSelector')) {
                    showEvent(me, 'off');
                    hasShowEvent = false;
                }
            }

            if (hasHideEvent) {
                return;
            }

            // 等冒泡结束
            setTimeout(
                function () {
                    hideEvent(me, 'on');
                    hasHideEvent = true;
                }
            );

        })
        .before('close', function () {
            if (!hasHideEvent && hasShowEvent) {
                return false;
            }
        })
        .after('close', function () {

            if (hasHideEvent) {
                hideEvent(me, 'off');
                hasHideEvent = false;
            }

            if (!hasShowEvent) {
                showEvent(me, 'on');
                hasShowEvent = true;
            }

        });

        var hidden = me.option('hidden');
        if ($.type('hidden') !== 'boolean') {
            hidden = isHidden(me.option('layerElement'));
        }

        if (hidden) {
            me.close();
        }
        else {
            me.open();
        }

    };

    /**
     * 显示
     */
    proto.open = function () {
        this.set('hidden', false);
    };

    /**
     * 隐藏
     */
    proto.close = function () {
        this.set('hidden', true);
    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        // 在 lifeCycle.dispose 前执行
        // 确保解绑了事件
        me.close();

        // 因为 close 会加上 showEvent 事件
        // 这里再次解绑
        showEvent(me, 'off');

        lifeCycle.dispose(me);

    };

    lifeCycle.extend(proto);


    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Popup.defaultOptions = {
        // 可以不传 triggerElement，为了少写 if，这里给个默认值
        triggerElement: $({}),
        showLayerTrigger: 'click',
        hideLayerTrigger: 'click',
        showLayerAnimate: function (options) {
            options.layerElement.show();
        },
        hideLayerAnimate: function (options) {
            options.layerElement.hide();
        }
    };

    /**
     * 视图更新
     *
     * @static
     * @type {Object}
     */
    Popup.propertyUpdater = {
        hidden: function (hidden) {
            this.execute(
                hidden ? 'hideLayerAnimate' : 'showLayerAnimate',
                {
                    layerElement: this.option('layerElement')
                }
            );
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
            popup.inner('showConfigs'),
            function (trigger, config) {
                triggers.show[ trigger ][ action ](popup, config);
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
            popup.inner('hideConfigs'),
            function (trigger, config) {
                triggers.hide[ trigger ][ action ](popup, config);
            }
        );
    }

    /**
     * 通用的绑定事件
     *
     * @inner
     * @param {Object} popup
     * @param {Object} config
     */
    function on(popup, config) {
        popup.option('triggerElement').on(
            config.type,
            popup.option('triggerSelector'),
            config.handler
        );
    }

    /**
     * 通用的解绑事件
     *
     * @inner
     * @param {Object} popup
     * @param {Object} config
     */
    function off(popup, config) {
        popup.option('triggerElement').off(
            config.type,
            config.handler
        );
    }

    /**
     * 创建响应 show 事件的事件处理函数
     *
     * @inner
     * @param {Popup} popup
     * @param {Function=} before 需要满足什么前置条件才可往下执行
     * @return {Function}
     */
    function createShowHandler(popup, before) {
        return function (e) {

            if ($.isFunction(before)) {
                if (!before.call(this, e)) {
                    return;
                }
            }

            popup.open(e);

        };
    }

    /**
     * 创建响应 hide 事件的事件处理函数
     *
     * @inner
     * @param {Popup} popup
     * @param {Function=} before 需要满足什么前置条件才可往下执行
     * @return {Function}
     */
    function createHideHandler(popup, before) {
        return function (e) {

            if ($.isFunction(before)) {
                if (!before.call(this, e)) {
                    return;
                }
            }

            popup.close(e);

        };
    }

    function onDocument(popup, config) {
        instance.document.on(
            config.type,
            config.handler
        );
    }

    function offDocument(popup, config) {
        instance.document.off(
            config.type,
            config.handler
        );
    }

    /**
     * 创建响应 hide 失焦的事件处理函数
     *
     * @inner
     * @param {Popup} popup
     * @param {Function=} before 需要满足什么前置条件才可往下执行
     * @return {Function}
     */
    function createDocumentHideHandler(popup) {
        return createHideHandler(
            popup,
            function (e) {
                return !contains(
                    popup.option('layerElement'),
                    e.target
                );
            }
        );
    }


    var triggers = {

        show: {
            focus: {
                on: on,
                off: off,
                handler: createShowHandler
            },
            click: {
                on: on,
                off: off,
                handler: createShowHandler
            },
            enter: {
                on: on,
                off: off,
                handler: createShowHandler,
                startDelay: function (popup) {
                    return function (fn) {
                        popup.option('triggerElement').on(
                            trigger.leave.type,
                            popup.option('triggerSelector'),
                            fn
                        );
                    };
                },
                endDelay: function (popup) {
                    return function (fn) {
                        popup.option('triggerElement').off(
                            trigger.leave.type,
                            fn
                        );
                    };
                }
            },
            context: {
                on: on,
                off: off,
                handler: createShowHandler
            }
        },

        hide: {
            blur: {
                on: on,
                off: off,
                hanlder: createHideHandler
            },
            click: {
                on: onDocument,
                off: offDocument,
                handler: createDocumentHideHandler
            },
            leave: {
                on: function (popup, config) {
                    popup.option('triggerElement').on(
                        config.type,
                        popup.option('triggerSelector'),
                        config.handler
                    );
                    popup.option('layerElement').on(
                        config.type,
                        config.handler
                    );
                },
                off: function (popup, config) {
                    popup.option('triggerElement').off(
                        config.type,
                        config.handler
                    );
                    popup.option('layerElement').off(
                        config.type,
                        config.handler
                    );
                },
                handler: createHideHandler,
                startDelay: function (popup) {
                    return function (fn) {
                        popup.option('triggerElement').on(
                            trigger.enter.type,
                            popup.option('triggerSelector'),
                            fn
                        );
                        popup.option('layerElement').on(
                            trigger.enter.type,
                            fn
                        );
                    };
                },
                endDelay: function (popup) {
                    return function (fn) {
                        popup.option('triggerElement').off(
                            trigger.enter.type,
                            fn
                        );
                        popup.option('layerElement').off(
                            trigger.enter.type,
                            fn
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
