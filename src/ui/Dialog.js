/**
 * @file Dialog
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var Draggable = require('../helper/Draggable');
    var instance = require('../util/instance');

    var pin = require('../function/pin');
    var page = require('../function/page');
    var viewport = require('../function/viewport');
    var pageScrollTop = require('../function/pageScrollTop');
    var pageScrollLeft = require('../function/pageScrollLeft');
    var viewportWidth = require('../function/viewportWidth');
    var viewportHeight = require('../function/viewportHeight');
    var pageWidth = require('../function/pageWidth');
    var pageHeight = require('../function/pageHeight');
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
     * @property {string=} options.title 对话框标题
     * @property {string=} options.content 对话框内容
     * @property {number=} options.width 对话框整体宽度
     * @property {(number|string)=} options.x 窗口出现的 x 位置，可以是 数字(10) 或 百分比(50%)
     * @property {(number|string)=} options.y 窗口出现的 y 位置，可以是 数字(10) 或 百分比(50%)
     *
     * @property {boolean=} options.fixed 是否 fixed 定位，默认为 false
     * @property {boolean=} options.modal 是否是窗口模态，默认为 true
     * @property {boolean=} options.draggable 窗口是否可拖拽，拖拽位置需要用 headerSelector 配置
     * @property {boolean=} options.scrollable 是否可以滚动，默认为 false
     * @property {boolean=} options.hidden 初始化时是否隐藏，默认为 false
     * @property {boolean=} options.disposeOnHide 是否隐藏时销毁控件，默认为 true
     * @property {boolean=} options.removeOnDispose 销毁时是否移除元素，默认为 true
     * @property {boolean=} options.hideByClickMask 点击遮罩是否隐藏对话框，默认为 false
     *
     * @property {string=} options.template
     * @property {string=} options.headerSelector 可拖拽的元素（一般是头部）
     * @property {string=} options.titleSelector 填充 title 的元素
     * @property {string=} options.closeSelector 点击可关闭对话框的元素
     * @property {string=} options.bodySelector 填充 content 的元素
     * @property {string=} options.maskTemplate 遮罩模板
     *
     * @property {Function=} options.onBeforeShow
     * @property {Function=} options.onAterShow
     * @property {Function=} options.onBeforeHide
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

            var title = me.title;
            if (title) {
                element.find(me.titleSelector).html(title);
            }

            var content = me.content;
            if (content) {
                element.find(me.bodySelector).html(content);
            }

            var closeSelector = me.closeSelector;
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

            var element = me.element;
            var mask = me.mask;

            // 初始化遮罩
            if (me.modal && !mask) {
                // 遮罩放到对话框前面
                // 这样在 z-index 相同的情况下，对话框还能位于遮罩上方
                mask = me.mask = $(me.maskTemplate);
                element.before(mask);

                // 是否点击遮罩关闭对话框
                if (me.hideByClickMask) {
                    mask.on('click' + namespace, $.proxy(me.hide, me));
                }

                var zIndex = 'z-index';
                var maskZ = mask.css(zIndex);

                // 如果 mask 的 z-index 比 element 高，需要重置
                if ($.isNumeric(maskZ)
                    && maskZ > element.css(zIndex)
                ) {
                    element.css(zIndex, maskZ);
                }
            }

            refresh(me);

            var cache = me.cache;
            if (me.draggable) {
                cache.draggable = createDraggable(me);
            }

            element.show();
            mask && mask.show();

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

            me.element.hide();

            var mask = me.mask;
            mask && mask.hide();

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
            var mask = me.mask;

            element.off(namespace);
            mask && mask.off(namespace);

            if (me.removeOnDispose) {
                element.remove();
                mask && mask.remove();
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

        headerSelector: '.dialog-header',
        titleSelector: '.dialog-title',
        closeSelector: '.dialog-close',
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

        var instance = new Draggable({
                            element: element,
                            container: offsetParent(element),
                            handle: dialog.headerSelector,
                            cancel: [ dialog.titleSelector, dialog.closeSelector ]
                        });

        instance.setRectange(function () {

            var scrollable = dialog.scrollable;
            var fixed = dialog.fixed;

            return {
                x: (fixed || scrollable) ? 0 : pageScrollLeft(),
                y: (fixed || scrollable) ? 0 : pageScrollTop(),
                width: (fixed || !scrollable) ? viewportWidth() : pageWidth(),
                height: (fixed || !scrollable) ? viewportHeight() : pageHeight()
            };
        });

        return instance;
    }

    /**
     * 刷新对话框的位置
     *
     * @inner
     * @param {Dialog} dialog
     */
    function refresh(dialog) {

        var pWidth = pageWidth();
        var pHeight = pageHeight();
        var vWidth = viewportWidth();
        var vHeight = viewportHeight();

        var fixed = dialog.fixed;
        var scrollable = dialog.scrollable;

        var pinOptions = {

            element: dialog.element,
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
                x: pageScrollLeft(),
                y: pageScrollTop()
            };
        }

        pin(pinOptions);

        var mask = dialog.mask;
        if (mask) {
            mask.css({
                width: pWidth,
                height: pHeight
            });
        }
    }


    return Dialog;

});