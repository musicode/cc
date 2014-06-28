/**
 * @file Dialog
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var Draggable = require('../helper/Draggable');
    var instance = require('../util/instance');
    var dimension = require('../util/dimension');

    var pin = require('../function/pin');
    var page = require('../function/page');
    var viewport = require('../function/viewport');
    var offsetParent = require('../function/offsetParent');
    var debounce = require('../function/debounce');

    /**
     * 对话框
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.element 对话框元素，此配置可选
     *                                     如果传参，可把 title/content 写到模板上，把元素传进来
     *                                     如果未传，必须传 title/content
     *
     * @property {string=} options.title 对话框标题
     * @property {string=} options.content 对话框内容
     *
     * @property {number=} options.width 对话框整体宽度
     * @property {(number|string)=} options.x 窗口出现的 x 位置，可以是 数字(10) 或 百分比(50%)
     * @property {(number|string)=} options.y 窗口出现的 y 位置，可以是 数字(10) 或 百分比(50%)
     *
     * @property {boolean=} options.hidden 初始化时是否隐藏，默认为 false
     * @property {boolean=} options.fixed 是否 fixed 定位，默认为 false
     * @property {boolean=} options.modal 是否是窗口模态，默认为 true
     * @property {boolean=} options.draggable 窗口是否可拖拽，拖拽位置需要用 selector.header 配置
     * @property {boolean=} options.scrollable 是否可以滚动，默认为 false
     * @property {boolean=} options.disposeOnHide 是否隐藏时销毁控件，默认为 true
     * @property {boolean=} options.removeOnDispose 销毁时是否移除元素，默认为 true
     * @property {boolean=} options.hideByClickMask 点击遮罩是否隐藏对话框，默认为 false
     *
     * @property {string=} options.template 对话框模板
     *
     * @property {Object=} options.animation 对话框动画
     * @property {Function=} options.animation.show 显示对话框动画
     * @property {Function=} options.animation.hide 隐藏对话框动画
     * @property {Function=} options.animation.resize 窗口 resize 事件时调整窗口位置的动画
     *
     * @property {Object=} options.mask
     * @property {jQuery=} options.mask.element 遮罩元素
     * @property {string=} options.mask.template 如果没传遮罩，可传模板动态创建
     * @property {Object=} options.mask.animation 遮罩动画
     * @property {Function=} options.mask.animation.show 显示遮罩动画
     * @property {Function=} options.mask.animation.hide 隐藏遮罩动画
     *
     * @property {Object=} options.selector 选择器
     * @property {string=} options.selector.header 可拖拽的元素（一般是头部）
     * @property {string=} options.selector.title 填充 title 的元素
     * @property {string=} options.selector.close 点击可关闭对话框的元素
     * @property {string=} options.selector.body 填充 content 的元素
     *
     * @property {Function=} options.onBeforeShow 返回 false 可阻止显示
     * @property {Function=} options.onAterShow
     * @property {Function=} options.onBeforeHide 返回 false 可阻止隐藏
     * @property {Function=} options.onAterHide
     */
    function Dialog(options) {
        $.extend(this, Dialog.defaultOptions, options);
        this.init();
    }

    Dialog.prototype = {

        constructor: Dialog,

        /**
         * 初始化
         */
        init: function () {

            var me = this;

            var element = me.element
                        || (me.element = $(me.template));

            var width = me.width;
            if ($.isNumeric(width)) {
                element.width(width);
            }

            var selector = me.selector;

            var title = me.title;
            if (title) {
                element.find(selector.title).html(title);
            }

            var content = me.content;
            if (content) {
                element.find(selector.body).html(content);
            }

            var closeSelector = selector.close;
            if (closeSelector) {
                element.on('click' + namespace, closeSelector, $.proxy(me.hide, me));
            }

            var position = me.fixed ? 'fixed' : 'absolute';
            if (element.css('position') !== position) {
                element.css('position', position);
            }

            var body = instance.body;

            if (!offsetParent(element).is('body')) {
                body.append(element);
            }

            // 初始化遮罩
            var maskOptions = me.mask;
            if (me.modal && !maskOptions.element) {
                maskOptions.element = createMask(me);
            }

            me.cache = {
                // IE67 需要设置 document.documentElement 元素
                htmlOverflow: instance.html.css('overflow'),
                bodyOverflow: body.css('overflow')
            };

            me.hidden
            ? me.hide()
            : me.show();

        },

        /**
         * 显示对话框
         */
        show: function () {

            var me = this;

            if ($.isFunction(me.onBeforeShow)
                && me.onBeforeShow() === false
            ) {
                return;
            }

            var overflow = me.scrollable ? 'auto' : 'hidden';
            instance.html.css('overflow', overflow);
            instance.body.css('overflow', overflow);

            refresh(me);

            var cache = me.cache;
            if (me.draggable) {
                cache.draggable = createDraggable(me);
            }

            var animation = me.animation;

            if ($.isFunction (animation.show)) {
                animation.show.call(me);
            }
            else {
                me.element.show();
            }

            var maskOptions = me.mask;
            var maskAnimation = maskOptions.animation;

            if (maskAnimation && $.isFunction(maskAnimation.show)) {
                maskAnimation.show.call(me);
            }
            else if (maskOptions.element) {
                maskOptions.element.show();
            }

            me.hidden = false;

            instance.window
                    .resize(
                        cache.resizer =
                        debounce(
                            function () {
                                refresh(me);
                            },
                            50
                        )
                    );

            if ($.isFunction(me.onAterShow)) {
                me.onAterShow();
            }
        },

        /**
         * 隐藏对话框
         */
        hide: function () {

            var me = this;

            if ($.isFunction(me.onBeforeHide)
                && me.onBeforeHide() === false
            ) {
                return;
            }

            var cache = me.cache;
            instance.html.css('overflow', cache.htmlOverflow);
            instance.body.css('overflow', cache.bodyOverflow);

            if (cache.resizer) {
                instance.window.off('resize', cache.resizer);
            }

            if (cache.draggable) {
                cache.draggable.dispose();
            }

            var animation = me.animation;
            if ($.isFunction (animation.hide)) {
                animation.hide.call(me);
            }
            else {
                me.element.hide();
            }

            var maskOptions = me.mask;
            var maskAnimation = maskOptions.animation;

            if (maskAnimation && $.isFunction(maskAnimation.hide)) {
                maskAnimation.hide.call(me);
            }
            else if (maskOptions.element) {
                maskOptions.element.hide();
            }

            me.hidden = true;

            if ($.isFunction(me.onAfterHide)) {
                me.onAfterHide();
            }

            if (me.disposeOnHide) {
                me.dispose();
            }
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            // 避免循环调用
            me.disposeOnHide = false;
            if (!me.hidden) {
                me.hide();
            }

            var element = me.element;
            var maskElement = me.mask.element;

            element.off(namespace);
            maskElement && maskElement.off(namespace);

            if (me.removeOnDispose) {
                element.remove();
                maskElement && maskElement.remove();
            }

            me.element =
            me.mask =
            me.cache = null;
        }

    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Dialog.defaultOptions = {

        x: '50%',
        y: '50%',

        modal: true,
        fixed: false,  // 为了支持 IE6...
        hidden: false,
        draggable: true,
        scrollable: false,
        disposeOnHide: true,
        removeOnDispose: true,
        hideByClickMask: false,

        animation: { },
        selector: {
            header: '.dialog-header',
            title: '.dialog-title',
            close: '.dialog-close',
            body: '.dialog-body',
        },

        mask: {
            template: '<div class="dialog-mask"></div>',
            animation: { }
        },

        template: '<div class="dialog">'
                +     '<div class="dialog-header">'
                +         '<h1 class="dialog-title"></h1>'
                +         '<i class="dialog-close">&times;</i>'
                +     '</div>'
                +     '<div class="dialog-body"></div>'
                + '</div>'
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_dialog';

    /**
     * 创建可拖拽组件
     *
     * @inner
     * @param {Dialog} dialog
     * @return {Draggable}
     */
    function createDraggable(dialog) {

        var element = dialog.element;
        var selector = dialog.selector;

        var instance = new Draggable({
                            element: element,
                            container: offsetParent(element),
                            selector: {
                                handle: selector.header,
                                cancel: [ selector.title, selector.close ]
                            }
                        });

        instance.setRectange(
            function () {

                var scrollable = dialog.scrollable;
                var fixed = dialog.fixed;

                return {
                    x: (fixed || scrollable) ? 0 : dimension.getPageScrollLeft(),
                    y: (fixed || scrollable) ? 0 : dimension.getPageScrollTop(),
                    width: (fixed || !scrollable) ? dimension.getViewportWidth() : dimension.getPageWidth(),
                    height: (fixed || !scrollable) ? dimension.getViewportHeight() : dimension.getPageHeight()
                };
            }
        );

        return instance;
    }

    /**
     * 刷新对话框的位置
     *
     * @inner
     * @param {Dialog} dialog
     */
    function refresh(dialog) {

        var pWidth = dimension.getPageWidth();
        var pHeight = dimension.getPageHeight();
        var vWidth = dimension.getViewportWidth();
        var vHeight = dimension.getViewportHeight();

        var fixed = dialog.fixed;
        var scrollable = dialog.scrollable;

        var element = dialog.element;
        var pinOptions = {

            silence: true,

            element: element,
            x: dialog.x === '50%' ? '50%' : 0,
            y: dialog.y === '50%' ? '50%' : 0,

            attachment: {
                element: fixed ? viewport() : page(),
                width: (fixed || !scrollable) ? vWidth : pWidth,
                height: (fixed || !scrollable) ? vHeight : pHeight,
                x: dialog.x,
                y: dialog.y
            }
        };

        if (!fixed && !scrollable) {
            pinOptions.offset = {
                x: dimension.getPageScrollLeft(),
                y: dimension.getPageScrollTop()
            };
        }

        var style = pin(pinOptions);
        var animate = dialog.animation.resize;

        if ($.isFunction(animate)) {
            animate.call(dialog, style);
        }
        else {
            element.css(style);
        }

        var maskElement = dialog.mask.element;
        if (maskElement) {
            maskElement.css({
                width: pWidth,
                height: pHeight
            });
        }
    }

    /**
     * 创建遮罩元素
     *
     * @inner
     * @param {Dialog} dialog
     * @return {jQuery}
     */
    function createMask(dialog) {

        var maskOptions = dialog.mask;

        var maskElement = $(maskOptions.template);

        // 遮罩放到对话框前面
        // 这样在 z-index 相同的情况下，对话框还能位于遮罩上方
        var element = dialog.element;
        element.before(maskElement);

        // 如果不可滚，不仅是 body 元素，连遮罩也要设置 overflow: hidden
        if (!dialog.scrollable) {
            maskElement.css('overflow', 'hidden');
        }

        // 是否点击遮罩关闭对话框
        if (dialog.hideByClickMask) {
            maskElement.on('click' + namespace, $.proxy(dialog.hide, dialog));
        }

        var zIndex = 'z-index';
        var maskZ = maskElement.css(zIndex);

        // 如果 mask 的 z-index 比 element 高，需要重置
        if ($.isNumeric(maskZ)) {

            var dialogZ = element.css(zIndex);

            if (!$.isNumeric(dialogZ)
                || maskZ > dialogZ
            ) {
                element.css(zIndex, maskZ);
            }
        }

        return maskElement;
    }


    return Dialog;

});