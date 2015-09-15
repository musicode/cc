/**
 * @file ContextMenu
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var Popup = require('../helper/Popup');
    var body = require('../util/instance').body;

    var pin = require('../function/pin');
    var isHidden = require('../function/isHidden');
    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var eventPage = require('../function/eventPage');
    var offsetParent = require('../function/offsetParent');

    /**
     * 鼠标右键菜单
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.element 菜单元素
     * @property {string=} options.template 如果想动态生成元素，可不传 element，而是传入模板
     *
     * @property {jQuery=} options.container 在 container 内部右键弹出菜单，默认是 body
     *
     * @property {Object} options.show
     * @property {number=} options.show.delay 显示延时
     * @property {Function=} options.show.animation 显示动画
     *
     * @property {Object} options.hide
     * @property {number=} options.hide.delay 隐藏延时
     * @property {Function=} options.hide.animation 隐藏动画
     *
     * @property {Object=} options.action 可选，配置点击事件处理器
     *                     {
     *                         '.add-user': function (e) { },
     *                         '.remove-user': function (e) { }
     *                     }
     *                     key 是选择器，value 是 handler
     */
    function ContextMenu(options) {
        return lifeCycle.init(this, options);
    }

    var proto = ContextMenu.prototype;


    proto.type = 'ContextMenu';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;
        var element = me.element;
        var container = me.container;

        var contextEvent;

        var initMenu = function (element) {

            me.element = element;

            // 默认隐藏
            if (!isHidden(element)) {
                element.hide();
            }

            // body 必须是定位容器
            if (!offsetParent(element).is('body')) {
                body.append(element);
            }

            // 绑定点击事件
            var action = me.action;
            if (action) {
                $.each(
                    action,
                    function (selector, handler) {
                        element.on(
                            'click' + namespace,
                            selector,
                            function () {
                                handler.call(
                                    me,
                                    contextEvent
                                );
                            }
                        );
                    }
                );
            }

            me.popup = new Popup({
                layer: element,
                show: me.show,
                hide: me.hide,
                context: me
            });

        };

        if (element) {
            initMenu(element);
        }

        container
        .on('contextmenu' + namespace, function (e) {

            var template = me.template;

            // 惰性初始化
            if (!element && template) {
                element = $(template);
                initMenu(element);
            }

            if (activeMenu && activeMenu !== me) {
                activeMenu.close();
            }

            contextEvent = e;

            activeMenu = me;
            activeMenu.open();

            var pos = eventPage(e);

            pin({
                element: element,
                x: 0,
                y: 0,
                attachment: {
                    element: body,
                    x: pos.x,
                    y: pos.y
                }
            });

            // 禁掉默认菜单
            e.preventDefault();

            // 防止被外层响应
            e.stopPropagation();

        });

    };

    /**
     * 显示菜单
     */
    proto.open = function () {
        this.popup.open();
    };

    /**
     * 隐藏菜单
     */
    proto.close = function () {
        this.popup.close();
    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        var popup = me.popup;
        if (popup) {
            popup.dispose();
            me.popup = null;
        }

        var element = me.element;
        if (element) {
            element.remove();
            me.element = null;
        }

        me.container.off(namespace);
        me.container = null;

        if (activeMenu === me) {
            activeMenu = null;
        }

    };

    jquerify(proto);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    ContextMenu.defaultOptions = {
        container: body,
        hide: {
            trigger: 'click,context'
        }
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_contextmenu';

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
