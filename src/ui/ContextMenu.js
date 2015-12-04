/**
 * @file ContextMenu
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var pin = require('../function/pin');
    var eventPage = require('../function/eventPage');

    var Popup = require('../helper/Popup');

    var instanceUtil = require('../util/instance');
    var lifeUtil = require('../util/life');

    /**
     * 鼠标右键菜单
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.mainElement 菜单元素
     * @property {jQuery=} options.watchElement 在 watchElement 内部响应右键菜单
     *
     * @property {Function=} options.showAnimation 菜单显示动画
     * @property {Function=} options.hideAnimation 菜单隐藏动画
     *
     * @property {Object=} options.action 可选，配置点击事件处理器
     *                     {
     *                         '.add-user': function (e) { },
     *                         '.remove-user': function (e) { }
     *                     }
     *                     key 是选择器，value 是 handler
     */
    function ContextMenu(options) {
        lifeUtil.init(this, options);
    }

    var proto = ContextMenu.prototype;

    proto.type = 'ContextMenu';

    proto.init = function () {

        var me = this;

        me.initStruct();

        var mainElement = me.option('mainElement');

        // 绑定点击事件
        var contextEvent;
        var namespace = me.namespace();

        var action = me.option('action');
        if (action) {
            $.each(action, function (selector, handler) {
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
            });
        }

        var popup = new Popup({
            layerElement: mainElement,
            hideLayerTrigger: 'click,context',
            showLayerAnimation: function () {
                me.execute(
                    'showAnimation',
                    {
                        mainElement: mainElement
                    }
                );
            },
            hideLayerAnimation: function () {
                me.execute(
                    'hideAnimation',
                    {
                        mainElement: mainElement
                    }
                );
            },
            stateChange: {
                opened: function (opened) {
                    me.state('hidden', !opened);
                }
            }
        });

        popup.on('dispatch', function (e, data) {

            var type;
            var event = data.event;

            switch (event.type) {
                case 'beforeopen':
                    type = 'beforeshow';
                    break;
                case 'afteropen':
                    type = 'aftershow';
                    break;
                case 'beforeclose':
                    type = 'beforehide';
                    break;
                case 'afterclose':
                    type = 'afterhide';
                    break
            }

            if (type) {
                event.type = type;
            }

            me.emit(event, data.data, true);

        });

        me.inner({
            popup: popup,
            main: mainElement
        });

        me.option('watchElement')
        .on('contextmenu' + namespace, function (e) {

            if (activeMenu) {
                activeMenu.hide(e);
            }

            contextEvent = e;

            activeMenu = me;
            activeMenu.show(e);

            var pos = eventPage(e);

            pin({
                element: mainElement,
                x: 0,
                y: 0,
                attachment: {
                    element: instanceUtil.body,
                    x: pos.x,
                    y: pos.y
                }
            });

            return false;

        });

    };


    proto.show = function () {
        this.state('hidden', false);
    };
    proto._show = function (e) {
        if (!this.is('hidden')) {
            return false;
        }
        return dispatchEvent(e);
    };
    proto.show_ = dispatchEvent;


    proto.hide = function () {
        this.state('hidden', true);
    };
    proto._hide = function (e) {
        if (this.is('hidden')) {
            return false;
        }
        return dispatchEvent(e);
    };
    proto.hide_ = dispatchEvent;


    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.inner('popup').dispose();
        me.option('watchElement').off(
            me.namespace()
        );

        if (activeMenu === me) {
            activeMenu = null;
        }

    };

    lifeUtil.extend(proto);

    ContextMenu.stateUpdater = {

        hidden: function (hidden) {
            var popup = this.inner('popup');
            if (hidden) {
                popup.close();
            }
            else {
                popup.open();
            }
        }

    };

    var activeMenu;

    function dispatchEvent(e) {
        if (e) {
            return {
                dispatch: true
            };
        }
    }


    return ContextMenu;

});
