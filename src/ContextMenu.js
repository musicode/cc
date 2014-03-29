/**
 * @file ContextMenu
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var Popup = require('./Popup');
    var position = require('./position');

    /**
     * 鼠标右键菜单
     *
     * @constructor
     * @param {Object} options
     * @param {jQuery} options.container 在 container 内部右键弹出菜单
     * @param {jQuery|string} options.element 菜单元素，也可以是字符串模版
     * @param {string=} options.className 可选，菜单元素的 className
     * @param {Object=} options.clickEvents 可选，配置点击事件处理器
     *                 {
     *                     '.add-user': function (e) { },
     *                     '.remove-user': function (e) { }
     *                 }
     *                 key 是选择器，value 是 handler
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
            var element = me.element;
            if (typeof element !== 'string') {
                initMenuElement(element);
            }

            me.cache = { };
            me.container.on('contextmenu', me, popupMenu);
        },

        /**
         * 显示是通过右键点击触发的
         * 隐藏则可能需要手动触发，如选中某个菜单命令
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

            var element = me.element;

            var cache = me.cache;
            if (cache.popup) {
                element = cache.element;
                cache.popup.dispose();
            }

            if (element && typeof element !== 'string') {
                element.remove();
            }

            me.container.off('contextmenu', popupMenu);

            me.cache =
            me.element =
            me.container = null;
        }
    };

    /**
     * body 元素
     *
     * @type {jQuery}
     */
    var body = $(document.body);

    /**
     * 当前正在显示的菜单
     * 同一时刻只能显示一个菜单
     *
     * @private
     * @type {ContextMenu}
     */
    var currentMenu;

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    ContextMenu.defaultOptions = {
        container: body,
        className: 'context-menu'
    };

    /**
     * contenxtmenu 事件处理器
     *
     * @private
     * @param {Event} e
     */
    function popupMenu(e) {
        var contextMenu = e.data;
        var cache = contextMenu.cache;

        if (!cache.element) {
            createMenu(contextMenu);
        }

        if (currentMenu && currentMenu !== contextMenu) {
            currentMenu.cache.popup.hide();
        }

        // 记录当前事件
        cache.event = e;

        currentMenu = contextMenu;

        cache.popup.show();

        position.pin({
            element: cache.element,
            x: 0,
            y: 0,
            attachmentX: e.pageX,
            attachmentY: e.pageY
        });

        // 防止被外层响应
        e.stopPropagation();
        // 禁掉默认菜单
        e.preventDefault();
    }

    /**
     * 创建菜单面板
     *
     * @private
     * @param {ContextMenu} contextMenu
     */
    function createMenu(contextMenu) {
        var cache = contextMenu.cache;
        var element = contextMenu.element;

        if (typeof element === 'string') {
            element = $(element);
            initMenuElement(element);
        }

        var events = contextMenu.clickEvents;
        if (events) {
            for (var type in events) {
                element.on(
                    'click',
                    type,
                    (function (handler) {
                        return function (e) {
                            handler.call(contextMenu, cache.event);
                        };
                    })(events[type])
                );
            }
        }

        if (contextMenu.className) {
            element.addClass(contextMenu.className);
        }

        var popup = new Popup({
            element: element,
            hideBy: 'blur'
        });

        cache.element = element;
        cache.popup = popup;
    }

    /**
     * 简单的初始化菜单元素
     *
     * @private
     * @param {jQuery} element
     */
    function initMenuElement(element) {
        // 默认隐藏
        if (element.css('display') !== 'none') {
            element.hide();
        }
        // 必须是 body 的直接子元素
        if (element.parent().prop('tagName') !== 'BODY') {
            element.appendTo(body);
        }
    }


    return ContextMenu;

});
