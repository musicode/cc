/**
 * @file ContextMenu
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var pin = require('../function/pin');
    var eventPage = require('../function/eventPage');

    var Popup = require('../helper/Popup');

    var body = require('../util/instance').body;
    var lifeUtil = require('../util/life');

    /**
     * 鼠标右键菜单
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.mainElement 菜单元素
     * @property {jQuery=} options.containerElement 在 containerElement 内部响应右键菜单
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
            opened: false,
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
            watchSync: {
                opened: function (opened) {
                    me.state('hidden', !opened);
                }
            }
        });

        var typeMap = {
            beforeopen: 'beforeshow',
            afteropen: 'aftershow',
            beforeclose: 'beforehide',
            afterclose: 'afterhide'
        };

        popup.on('dispatch', function (e, data) {

            var event = e.originalEvent;

            var type = typeMap[event.type];
            if (type) {
                event.type = type;
            }

            me.dispatch(
                me.emit(event, data),
                data
            );

        });

        me.inner({
            popup: popup,
            main: mainElement
        });

        var containerElement = me.option('containerElement') || body;

        containerElement
        .on('contextmenu' + namespace, function (e) {

            if (activeMenu) {
                var activePopup = activeMenu.inner('popup');
                activePopup.close(e);
                activePopup.sync();
            }

            contextEvent = e;

            activeMenu = me;

            popup.open(e);
            popup.sync();

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


    proto.show = function () {
        this.state('hidden', false);
    };

    proto.hide = function () {
        this.state('hidden', true);
    };

    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.inner('popup').dispose();
        me.option('containerElement').off(
            me.namespace()
        );

        if (activeMenu === me) {
            activeMenu = null;
        }

    };

    lifeUtil.extend(proto, [ 'show', 'hide' ]);

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


    return ContextMenu;

});
