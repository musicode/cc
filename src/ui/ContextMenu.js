/**
 * @file ContextMenu
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var Popup = require('../helper/Popup');
    var instance = require('../util/instance');

    var offsetParent = require('../function/offsetParent');
    var pin = require('../function/pin');

    /**
     * 鼠标右键菜单
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.container 在 container 内部右键弹出菜单
     * @property {jQuery=} options.element 菜单元素，也可以是字符串模版
     * @property {string=} options.template 如果想动态生成元素，可不传 element，而是传入模板
     * @property {string=} options.menuClass 可选，菜单元素的 className，便于全局统一样式，无需模板到处写
     * @property {Object=} options.clickEvents 可选，配置点击事件处理器
     *                     {
     *                         '.add-user': function (e) { },
     *                         '.remove-user': function (e) { }
     *                     }
     *                     key 是选择器，value 是 handler
     */
    function ContextMenu(options) {
        $.extend(this, ContextMenu.defaultOptions, options);
        this.init();
    }

    ContextMenu.prototype = {

        constructor: ContextMenu,

        /**
         * 初始化
         */
        init: function () {

            var me = this;

            me.cache = { };

            if (me.element) {
                initElement(me);
            }

            me.container.on('contextmenu' + namespace, me, popupMenu);
        },

        /**
         * 显示菜单
         */
        show: function () {
            this.cache.popup.show();
        },

        /**
         * 隐藏菜单
         */
        hide: function () {
            this.cache.popup.hide();
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            if (currentMenu === me) {
                currentMenu = null;
            }

            var popup = me.cache.popup;
            if (popup) {
                popup.dispose();
            }

            var element = me.element;
            if (element) {
                element.remove();
            }

            me.container.off(namespace);

            me.cache =
            me.element =
            me.container = null;
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    ContextMenu.defaultOptions = {
        container: instance.body,
        menuClass: 'context-menu'
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

        if (!contextMenu.element) {
            createMenu(contextMenu);
        }

        if (currentMenu && currentMenu !== contextMenu) {
            currentMenu.hide();
        }

        // 记录当前事件
        contextMenu.cache.event = e;

        currentMenu = contextMenu;

        currentMenu.show();

        pin({
            element: contextMenu.element,
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
     * 创建菜单面板
     *
     * @inner
     * @param {ContextMenu} contextMenu
     */
    function createMenu(contextMenu) {

        var template = contextMenu.template;

        if (!contextMenu.element && template) {
            contextMenu.element = $(template);
            initElement(contextMenu);
        }
    }

    /**
     * 简单的初始化菜单元素
     *
     * @inner
     * @param {ContextMenu} contextMenu
     */
    function initElement(contextMenu) {

        var element = contextMenu.element;

        // 添加全局样式
        var menuClass = contextMenu.menuClass;
        if (menuClass) {
            element.addClass(menuClass);
        }

        // 默认隐藏
        if (element.css('display') !== 'none') {
            element.hide();
        }

        // body 必须是定位容器
        if (!offsetParent(element).is('body')) {
            instance.body.append(element);
        }

        // 绑定点击事件
        var cache = contextMenu.cache;
        var events = contextMenu.clickEvents;

        if (events) {
            for (var selector in events) {
                element.on(
                    'click',
                    selector,
                    (function (handler) {
                        return function () {
                            handler.call(contextMenu, cache.event);
                        };
                    })(events[selector])
                );
            }
        }

        cache.popup = new Popup({
                            element: element,
                            trigger: {
                                hide: 'blur'
                            }
                        });
    }


    return ContextMenu;

});
