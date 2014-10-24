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
    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
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
     * @property {boolean=} options.draggable 窗口是否可拖拽，拖拽位置需要用 headerSelector 配置
     * @property {boolean=} options.scrollable 是否可以滚动，默认为 false
     * @property {boolean=} options.removeOnEmpty 当 title 或 content 为空时，是否隐藏 header 或 body 元素
     * @property {boolean=} options.disposeOnHide 是否隐藏时销毁控件，默认为 true
     * @property {boolean=} options.removeOnDispose 销毁时是否移除元素，默认为 true
     * @property {boolean=} options.hideOnClickMask 点击遮罩是否隐藏对话框，默认为 false
     * @property {number=} options.zIndex 不推荐使用这个，如果实在是被恶心的东西挡住了，只能加上一个更大的值
     *
     * @property {string=} options.template 对话框模板
     *
     * @property {Function=} options.showAnimation 显示对话框动画
     * @property {Function=} options.hideAnimation 隐藏对话框动画
     * @property {Function=} options.resizeAnimation 窗口 resize 事件时调整窗口位置的动画
     *
     * @property {jQuery=} options.mask 遮罩元素
     * @property {string=} options.maskTemplate 如果没传遮罩，可传模板动态创建
     * @property {Function=} options.showMaskAnimation 显示遮罩动画
     * @property {Function=} options.hideMaskAnimation 隐藏遮罩动画
     *
     * @property {string=} options.skinClass 皮肤
     * @property {string=} options.headerSelector 可拖拽的元素（一般是头部）
     * @property {string=} options.titleSelector 填充 title 的元素
     * @property {string=} options.closeSelector 点击可关闭对话框的元素
     * @property {string=} options.bodySelector 填充 content 的元素
     *
     * @property {Function=} options.onBeforeShow 返回 false 可阻止显示
     * @property {Function=} options.onAterShow
     * @property {Function=} options.onBeforeHide 返回 false 可阻止隐藏
     * @property {Function=} options.onAterHide
     */
    function Dialog(options) {
        return lifeCycle.init(this, options);
    }

    Dialog.prototype = {

        constructor: Dialog,

        type: 'Dialog',

        /**
         * 初始化
         */
        init: function () {

            var me = this;

            var element = me.element
                        || (me.element = $(me.template));

            var skinClass = me.skinClass;
            if (skinClass) {
                element.addClass(skinClass);
            }

            var removeOnEmpty = me.removeOnEmpty;

            var title = me.title;
            if (title) {
                element.find(me.titleSelector).html(title);
            }
            else if (removeOnEmpty) {
                element.find(me.headerSelector).remove();
            }

            var content = me.content;
            var bodyElement = element.find(me.bodySelector);
            if (content) {
                bodyElement.html(content);
            }
            else if (removeOnEmpty) {
                bodyElement.remove();
            }

            var closeSelector = me.closeSelector;
            var hideHandler = $.proxy(me.hide, me);
            if (closeSelector) {
                element.on('click' + namespace, closeSelector, hideHandler);
            }

            var style = {
                // 默认隐藏
                display: 'none'
            };

            if ($.isNumeric(me.width)) {
                style.width = me.width;
            }

            var position = me.fixed ? 'fixed' : 'absolute';
            if (element.css('position') !== position) {
                style.position = position;
            }

            if (!offsetParent(element).is('body')) {
                instance.body.append(element);
            }

            if (me.modal) {

                var mask = me.mask
                        || (me.mask = $(me.maskTemplate));

                // 默认隐藏
                mask.hide();

                // 遮罩放到对话框前面
                // 这样在 z-index 相同的情况下，对话框还能位于遮罩上方
                element.before(mask);

                // 是否点击遮罩关闭对话框
                if (me.hideOnClickMask) {
                    mask.on('click' + namespace, hideHandler);
                }

                var name = 'zIndex';
                var value = me[name];

                if (!$.isNumeric(value)) {
                    value = mask.css(name);
                    if (!$.isNumeric(value)) {
                        value = 'auto';
                    }
                }

                var maskStyle = {
                    overflow: 'hidden'
                };
                maskStyle[name] = value;

                mask.css(maskStyle);

                style[name] = value;
            }

            element.css(style);

            if (!me.hidden) {
                me.hidden = true;
                me.show();
            }
        },

        /**
         * 显示对话框
         */
        show: function () {

            var me = this;

            if (me.hidden === false) {
                return;
            }

            var event = me.emit('beforeShow');

            if (event.isDefaultPrevented()) {
                return;
            }

            var element = me.element;
            var scrollable = me.scrollable;

            setOverflow(
                scrollable ? 'auto' : 'hidden'
            );

            refresh(me);

            if (me.draggable) {
                me.drager = new Draggable({
                    element: element,
                    container: offsetParent(element),
                    handleSelector: me.headerSelector,
                    cancelSelector: [ me.titleSelector, me.closeSelector ],
                    rect: function () {
                        var fixed = me.fixed;

                        return {
                            x: (fixed || scrollable) ? 0 : dimension.getPageScrollLeft(),
                            y: (fixed || scrollable) ? 0 : dimension.getPageScrollTop(),
                            width: (fixed || !scrollable) ? dimension.getViewportWidth() : dimension.getPageWidth(),
                            height: (fixed || !scrollable) ? dimension.getViewportHeight() : dimension.getPageHeight()
                        };
                    }
                });
            }

            if ($.isFunction(me.showAnimation)) {
                me.showAnimation();
            }
            else {
                element.show();
            }

            if ($.isFunction(me.showMaskAnimation)) {
                me.showMaskAnimation();
            }
            else if (me.mask) {
                me.mask.show();
            }

            me.hidden = false;

            instance.window
                    .resize(
                        me.resizer =
                        debounce(
                            function () {
                                refresh(me);
                            },
                            50
                        )
                    );

            me.emit('afterShow');
        },

        /**
         * 隐藏对话框
         */
        hide: function () {

            var me = this;

            if (me.hidden === true) {
                return;
            }

            var event = me.emit('beforeHide');

            if (event.isDefaultPrevented()) {
                return;
            }

            setOverflow(htmlOverflow, bodyOverflow);

            if (me.resizer) {
                instance.window.off('resize', me.resizer);
                me.resizer = null;
            }

            if (me.drager) {
                me.drager.dispose();
                me.drager = null;
            }

            if ($.isFunction(me.hideAnimation)) {
                me.hideAnimation();
            }
            else {
                me.element.hide();
            }

            if ($.isFunction(me.hideMaskAnimation)) {
                me.hideMaskAnimation();
            }
            else if (me.mask) {
                me.mask.hide();
            }

            me.hidden = true;

            me.emit('afterHide');

            if (me.disposeOnHide) {
                me.dispose();
            }
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            if (!me.hidden) {
                me.disposeOnHide = false;
                me.hide();
            }

            var element = me.element;
            var mask = me.mask;

            element.off(namespace);
            if (mask) {
                mask.off(namespace);
            }

            if (me.removeOnDispose) {
                element.remove();
                if (mask) {
                    mask.remove();
                }
            }

            me.element =
            me.mask = null;
        }

    };

    jquerify(Dialog.prototype);

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
        fixed: true,
        hidden: false,
        draggable: true,
        scrollable: true,
        removeOnEmpty: true,
        disposeOnHide: true,
        removeOnDispose: true,
        hideOnClickMask: false,

        headerSelector: '.dialog-header',
        titleSelector: '.dialog-header h1',
        closeSelector: '.dialog-close',
        bodySelector: '.dialog-body',

        template: '<div class="dialog">'
                +     '<i class="dialog-close">&times;</i>'
                +     '<div class="dialog-header"><h1></h1></div>'
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

    var htmlOverflow = instance.html.css('overflow');
    var bodyOverflow = instance.body.css('overflow');

    /**
     * 设置 overflow
     *
     * IE 必须设置 html 元素的 overflow
     *
     * @inner
     * @param {string} html
     * @param {string} body
     */
    function setOverflow(html, body) {
        body = body || html;
        instance.html.css('overflow', html);
        instance.body.css('overflow', body);
    }

    /**
     * 定位对话框 + 更新遮罩大小
     *
     * @inner
     * @param {Dialog} dialog
     */
    function refresh(dialog) {

        var element = dialog.element;
        var pinOptions = {

            silence: true,

            element: element,
            x: dialog.x === '50%' ? '50%' : 0,
            y: dialog.y === '50%' ? '50%' : 0,

            attachment: {
                element: viewport(),
                width: dimension.getViewportWidth(),
                height: dimension.getViewportHeight(),
                x: dialog.x,
                y: dialog.y
            }
        };

        if (!dialog.fixed) {
            pinOptions.offset = {
                x: dimension.getPageScrollLeft(),
                y: dimension.getPageScrollTop()
            };
        }

        var style = pin(pinOptions);

        if ($.isFunction(dialog.resizeAnimation)) {
            dialog.resizeAnimation(style);
        }
        else {
            element.css(style);
        }

        var mask = dialog.mask;
        if (mask) {
            mask.css({
                width: dimension.getPageWidth(),
                height: dimension.getPageHeight()
            });
        }
    }


    return Dialog;

});