/**
 * @file ContextMenu
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var Popup = require('../helper/Popup');
    var instance = require('../util/instance');

    var pin = require('../function/pin');
    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
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

    ContextMenu.prototype = {

        constructor: ContextMenu,

        type: 'ContextMenu',

        /**
         * 初始化
         */
        init: function () {

            var me = this;

            if (me.element) {
                initMenu(me);
            }

            me
            .container
            .on('contextmenu' + namespace, me, popupMenu);
        },

        /**
         * 显示菜单
         */
        open: function () {
            this.popup.open();
        },

        /**
         * 隐藏菜单
         */
        close: function () {
            this.popup.close();
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            if (currentMenu === me) {
                currentMenu = null;
            }

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
        }
    };

    jquerify(ContextMenu.prototype);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    ContextMenu.defaultOptions = {
        container: instance.body,
        hide: { }
    };

    /**
     * 当前正在显示的菜单
     * 同一时刻只能显示一个菜单
     *
     * @inner
     * @type {ContextMenu}
     */
    var currentMenu;

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_contextmenu';

    /**
     * contextmenu 事件处理器
     *
     * @inner
     * @param {Event} e
     */
    function popupMenu(e) {

        var contextMenu = e.data;
        var element = contextMenu.element;
        var template = contextMenu.template;

        if (!element && template) {
            element = contextMenu.element = $(template);
            initMenu(contextMenu);
        }

        if (currentMenu && currentMenu !== contextMenu) {
            currentMenu.close();
        }

        // 记录当前事件
        contextMenu.contextEvent = e;

        currentMenu = contextMenu;
        currentMenu.open();

        pin({
            element: element,
            x: 0,
            y: 0,
            attachment: {
                element: instance.body,
                x: e.pageX,
                y: e.pageY
            }
        });

        // 防止被外层响应
        e.stopPropagation();
        // 禁掉默认菜单
        e.preventDefault();
    }

    /**
     * 简单的初始化菜单元素
     *
     * @inner
     * @param {ContextMenu} contextMenu
     */
    function initMenu(contextMenu) {

        var element = contextMenu.element;

        // 默认隐藏
        if (element.is(':visible')) {
            element.hide();
        }

        // body 必须是定位容器
        if (!offsetParent(element).is('body')) {
            instance.body.append(element);
        }

        // 绑定点击事件
        var action = contextMenu.action;
        if (action) {
            $.each(
                action,
                function (selector, handler) {
                    element.on(
                        'click',
                        selector,
                        function () {
                            handler.call(
                                contextMenu,
                                contextMenu.contextEvent
                            );
                        }
                    );
                }
            );
        }

        var show = contextMenu.show;
        var hide = contextMenu.hide;

        if (!hide.trigger) {
            hide.trigger = 'click,context';
        }

        var animation = show.animation;
        if ($.isFunction(animation)) {
            show.animation = $.proxy(animation, contextMenu);
        }

        animation = hide.animation;
        if ($.isFunction(animation)) {
            hide.animation = $.proxy(animation, contextMenu);
        }

        contextMenu.popup = new Popup({
            layer: element,
            show: show,
            hide: hide
        });
    }


    return ContextMenu;

});
