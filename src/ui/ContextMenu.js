/**
 * @file ContextMenu
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var Popup = require('../helper/Popup');
    var body = require('../util/instance').body;

    var pin = require('../function/pin');
    var lifeCycle = require('../function/lifeCycle');
    var eventPage = require('../function/eventPage');
    var offsetParent = require('../function/offsetParent');

    /**
     * 鼠标右键菜单
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.mainElement 菜单元素
     * @property {string=} options.mainTemplate 如果想动态生成元素，可不传 mainElement，而是传入模板
     *
     * @property {jQuery=} options.watchElement 在 watchElement 内部响应右键菜单，默认是 body
     *
     * @property {string=} options.showTrigger 显示的触发方式
     * @property {number=} options.showDelay 显示延时
     * @property {Function=} options.showAnimate 显示动画
     *
     * @property {string=} options.hideTrigger 隐藏的触发方式
     * @property {number=} options.hideDelay 隐藏延时
     * @property {Function=} options.hideAnimate 隐藏动画
     *
     * @property {Object=} options.action 可选，配置点击事件处理器
     *                     {
     *                         '.add-user': function (e) { },
     *                         '.remove-user': function (e) { }
     *                     }
     *                     key 是选择器，value 是 handler
     */
    function ContextMenu(options) {
        lifeCycle.init(this, options);
    }

    var proto = ContextMenu.prototype;


    proto.type = 'ContextMenu';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        var contextEvent;
        var namespace = me.namespace();

        var initMenu = function (mainElement) {

            // body 必须是定位容器
            if (!offsetParent(mainElement).is('body')) {
                body.append(mainElement);
            }

            // 绑定点击事件
            var action = me.option('action');
            if (action) {
                $.each(
                    action,
                    function (selector, handler) {
                        mainElement.on(
                            'click' + namespace,
                            selector,
                            function () {
                                me.execute(
                                    handler,
                                    contextEvent
                                );
                            }
                        );
                    }
                );
            }

            var popup = new Popup({
                layerElement: mainElement,
                showLayerTrigger: me.option('showTrigger'),
                showLayerDelay: me.option('showDelay'),
                hideLayerTrigger: me.option('hideTrigger'),
                hideLayerDelay: me.option('hideDelay'),
                showLayerAnimate: function () {
                    me.execute(
                        'showAnimate',
                        {
                            mainElement: mainElement
                        }
                    );
                },
                hideLayerAnimate: function () {
                    me.execute(
                        'hideAnimate',
                        {
                            mainElement: mainElement
                        }
                    );
                }
            });


            var dispatchEvent = function (e) {
                if (e.target.tagName) {
                    me.emit(e);
                }
            };

            popup
            .before('open', dispatchEvent)
            .after('open', dispatchEvent)
            .before('close', dispatchEvent)
            .after('close', dispatchEvent);

            // 默认隐藏
            if (!popup.get('hidden')) {
                popup.close();
            }

            me.inner({
                popup: popup,
                main: mainElement
            });

        };

        var mainElement = me.option('mainElement');
        if (mainElement) {
            initMenu(mainElement);
        }

        me.option('watchElement')
        .on('contextmenu' + namespace, function (e) {

            var mainTemplate = me.option('mainTemplate');

            // 惰性初始化
            if (!mainElement && mainTemplate) {
                mainElement = $(mainTemplate);
                initMenu(mainElement);
            }

            if (activeMenu && activeMenu !== me) {
                activeMenu.close();
            }

            contextEvent = e;

            activeMenu = me;
            activeMenu.open();

            var pos = eventPage(e);

            pin({
                element: mainElement,
                x: 0,
                y: 0,
                attachment: {
                    element: body,
                    x: pos.x,
                    y: pos.y
                }
            });

            return false;

        });

    };

    proto.open = function () {
        this.inner('popup').open();
    };

    proto.close = function () {
        this.inner('popup').close();
    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        var popup = me.inner('popup');
        if (popup) {
            popup.dispose();
        }

        var mainElement = me.inner('main');
        if (mainElement) {
            mainElement.remove();
        }

        me.option('watchElement').off(
            me.namespace()
        );

        if (activeMenu === me) {
            activeMenu = null;
        }

    };

    lifeCycle.extend(proto);

    ContextMenu.defaultOptions = {
        watchElement: body,
        hideTrigger: 'click,context',
        showAnimate: function (options) {
            options.mainElement.show();
        },
        hideAnimate: function (options) {
            options.mainElement.hide();
        }
    };

    /**
     * 当前正在显示的菜单
     * 同一时刻只能显示一个菜单
     *
     * @inner
     * @type {ContextMenu}
     */
    var activeMenu;


    return ContextMenu;

});
