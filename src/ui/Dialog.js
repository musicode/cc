/**
 * @file Dialog
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var Draggable = require('../helper/Draggable');
    var position = require('../util/position');
    var offsetParent = require('../function/offsetParent');

    /**
     * 对话框
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.element 对话框元素，此配置可选
     *                                     如果传参，可把 title/content 写到模板上，把元素传进来
     *                                     如果未传，必须传 title/content
     * @property {string=} options.title 对话框标题
     * @property {string=} options.content 对话框内容
     * @property {number} options.width 对话框整体宽度
     * @property {number=} options.x 窗口出现的 x 位置
     * @property {number=} options.y 窗口出现的 y 位置
     * @property {boolean=} options.fixed 是否 fixed 定位
     * @property {boolean=} options.modal 是否是窗口模态，默认为 true
     * @property {boolean=} options.draggable 窗口是否可拖拽，拖拽位置需要用 headerSelector 配置
     * @property {boolean=} options.hidden 初始化时是否隐藏，默认为 false
     * @property {boolean=} options.disposeOnHide 是否隐藏时销毁控件，默认为 true
     * @property {boolean=} options.removeOnDispose 销毁时是否移除元素，默认为 true
     * @property {string=} options.template
     * @property {string=} options.headerSelector 可拖拽的部分（一般是头部）
     * @property {string=} options.titleSelector
     * @property {string=} options.bodySelector
     * @property {string=} options.maskTemplate 遮罩模板
     *
     * @property {Function} options.onBeforeShow
     * @property {Function} options.onAterShow
     * @property {Function} options.onBeforeHide
     * @property {Function} options.onAterHide
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

            var title = me.title;
            var content = me.content;
            var closeSelector = me.closeSelector;

            if (title) {
                element.find(me.titleSelector).html(title);
            }
            if (content) {
                element.find(me.bodySelector).html(content);
            }
            if (closeSelector) {
                element.on('click', closeSelector, me, closeDialog);
            }

            // 把元素扔到 body 下
            if (!element.parent().length) {
                element.appendTo('body');
            }

            if (me.draggable) {
                me.cache = {
                    draggable: new Draggable({
                        element: element,
                        container: offsetParent(element),
                        handle: me.headerSelector,
                        cancel: me.titleSelector
                    })
                };
            }

            me.hidden ? me.hide() : me.show();

        },

        show: function () {

            var me = this;
            var element = me.element;
            var mask = me.mask;

            // 定位元素
            position.pin({
                element: element,
                attachment: offsetParent(element),
                x: me.x === '50%' ? '50%' : 0,
                y: me.y === '50%' ? '50%' : 0,
                attachmentX: me.x,
                attachmentY: me.y
            });

            if (me.modal) {
                // 遮罩放到对话框前面
                if (!mask) {
                    mask = me.mask = $(me.maskTemplate);
                    element.before(mask);
                }

                // 如果 mask 的 z-index 比 element 高，需要重置下
                var zIndex = 'z-index';
                var maskZ = mask.css(zIndex);
                if (maskZ > element.css(zIndex)) {
                    element.css(zIndex, maskZ);
                }
            }

            if ($.isFunction(me.onBeforeShow)) {
                me.onBeforeShow();
            }

            mask && mask.show();
            element.show();

            if ($.isFunction(me.onAterShow)) {
                me.onAterShow();
            }
        },

        hide: function () {

            var me = this;

            if ($.isFunction(me.onBeforeHide)) {
                me.onBeforeHide();
            }

            var mask = me.mask;
            if (mask) {
                mask.hide();
            }

            if (me.disposeOnHide) {
                me.dispose();
            }
            else {
                me.element.hide();
            }

            if ($.isFunction(me.onAfterHide)) {
                me.onAfterHide();
            }

        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;
            var cache = me.cache;
            var element = me.element;

            if (cache.draggable) {
                cache.draggable.dispose();
            }

            if (me.closeSelector) {
                element.off('click', closeDialog);
            }

            if (me.removeOnDispose) {
                element.remove();
                if (me.mask) {
                    me.mask.remove();
                }
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

        modal: true,
        hidden: false,
        draggable: true,
        disposeOnHide: true,
        removeOnDispose: true,

        x: '50%',
        y: '50%',

        headerSelector: '.dialog-header',
        closeSelector: '.dialog-close',
        titleSelector: '.dialog-title',
        bodySelector: '.dialog-body',

        template: '<div class="dialog">'
                +     '<div class="dialog-header">'
                +         '<h1 class="dialog-title"></h1>'
                +         '<i class="dialog-close">&times;</i>'
                +     '</div>'
                +     '<div class="dialog-body"></div>'
                + '</div>',

        maskTemplate: '<div class="dialog-mask"></div>'
    };


    /**
     * 点击关闭按钮关闭对话框
     *
     * @inner
     * @param {Event} e
     */
    function closeDialog(e) {
        e.data.hide();
    }


    return Dialog;

});