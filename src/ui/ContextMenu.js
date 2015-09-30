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
     * @property {jQuery=} options.watchElement 在 watchElement 内部响应右键菜单，默认是 body
     *
     * @property {Function=} options.showAnimation 显示动画
     *
     * @property {string=} options.hideTrigger 隐藏的触发方式
     * @property {number=} options.hideDelay 隐藏延时
     * @property {Function=} options.hideAnimation 隐藏动画
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
            hideLayerTrigger: me.option('hideTrigger'),
            hideLayerDelay: me.option('hideDelay'),
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


        var dispatchEvent = function (e, type, data) {
            if (e.target.tagName) {
                e.type = type;
                me.emit(e, data);
            }
        };

        popup
        .before('open', function (e, data) {
            dispatchEvent(e, 'beforeshow', data);
        })
        .after('open', function (e, data) {
            dispatchEvent(e, 'aftershow', data);
        })
        .before('close', function (e, data) {
            dispatchEvent(e, 'beforehide', data);
        })
        .after('close', function (e, data) {
            dispatchEvent(e, 'afterhide', data);
        });

        me.inner({
            popup: popup,
            main: mainElement
        });

        me.option('watchElement')
        .on('contextmenu' + namespace, function (e) {

            if (activeMenu) {
                activeMenu.hide();
            }

            contextEvent = e;

            activeMenu = me;
            activeMenu.show();

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

    proto._show = function () {
        if (!this.is('hidden')) {
            return false;
        }
    };

    proto.hide = function () {
        this.state('hidden', true);
    };

    proto._hide = function () {
        if (this.is('hidden')) {
            return false;
        }
    };

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


    return ContextMenu;

});
