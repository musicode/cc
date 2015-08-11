/**
 * @file Dialog
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var instance = require('../util/instance');
    var dimension = require('../util/dimension');

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var offsetParent = require('../function/offsetParent');
    var debounce = require('../function/debounce');

    var pinGlobal = require('../function/pinGlobal');
    var dragGlobal = require('../function/dragGlobal');

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
     * @property {boolean=} options.draggable 窗口是否可拖拽，拖拽位置需要用 draggableHandleSelector 和 draggableCancelSelector 配置
     * @property {boolean=} options.scrollable 是否可以滚动，默认为 false
     * @property {boolean=} options.positionOnResize 触发 resize 事件时是否重定位
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
     * @property {string=} options.draggableClass 可拖拽时给 element 添加的 class
     * @property {string=} options.draggingClass 拖拽时给 element 添加的 class
     *
     * @property {string=} options.draggableHandleSelector 可拖拽的元素
     * @property {string=} options.draggableCancelSelector 不可拖拽的元素
     *
     * @property {string=} options.headerSelector 可拖拽的元素（一般是头部）
     * @property {string=} options.titleSelector 填充 title 的元素
     * @property {string=} options.closeSelector 点击可关闭对话框的元素
     * @property {string=} options.bodySelector 填充 content 的元素
     *
     * @property {Function=} options.onBeforeShow 返回 false 可阻止显示
     * @property {Function=} options.onAfterShow
     * @property {Function=} options.onBeforeHide 返回 false 可阻止隐藏
     * @property {Function=} options.onAfterHide
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

            var classList = [ ];

            var skinClass = me.skinClass;
            if (skinClass) {
                classList.push(skinClass);
            }

            var draggableClass = me.draggableClass;
            if (me.draggable && draggableClass) {
                classList.push(draggableClass);
            }

            if (classList.length > 0) {
                element.addClass(
                    classList.join(' ')
                );
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

            var style = { };

            if (me.width) {
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

            if (me.draggable) {
                me.drager = dragGlobal({
                    element: element,
                    handleSelector: me.draggableHandleSelector,
                    cancelSelector: me.draggableCancelSelector,
                    draggingClass: me.draggingClass,
                    fixed: me.fixed,
                    scrollable: scrollable
                });
            }

            // 因为 refresh 会设置 left top
            // 但是某些浏览器无法及时刷新 DOM，导致 Draggable 读出来的依然是 0 0
            // 所以这里换到 Draggable 后面调用
            me.refresh();

            me.showAnimation();

            if (me.mask) {
                me.showMaskAnimation();
            }

            me.hidden = false;

            instance.window
                    .resize(
                        me.resizer =
                        debounce(
                            function () {
                                me.refresh(true);
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

            me.hideAnimation();

            if (me.mask) {
                me.hideMaskAnimation();
            }

            me.hidden = true;

            me.emit('afterHide');

            if (me.disposeOnHide) {
                me.dispose();
            }
        },

        refresh: function () {

            var me = this;

            var isResize = arguments[0];

            if (!isResize || me.positionOnResize) {

                var dialogElement = me.element;
                var dialogStyle = pinGlobal({
                    element: dialogElement,
                    x: me.x,
                    y: me.y,
                    fixed: me.fixed
                });

                if (isResize) {
                    me.resizeAnimation(dialogStyle);
                }
                else {
                    dialogElement.css(dialogStyle);
                }

            }

            var maskElement = me.mask;
            if (maskElement) {
                maskElement.css({
                    width: dimension.getPageWidth(),
                    height: dimension.getPageHeight()
                });
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
        positionOnResize: true,

        draggableClass: 'draggable',

        draggableHandleSelector: '.dialog-header',
        draggableCancelSelector: [ '.dialog-header h1', '.dialog-close' ],

        headerSelector: '.dialog-header',
        titleSelector: '.dialog-header h1',
        closeSelector: '.dialog-close',
        bodySelector: '.dialog-body',

        template: '<div class="dialog">'
                +     '<i class="dialog-close">&times;</i>'
                +     '<div class="dialog-header"><h1></h1></div>'
                +     '<div class="dialog-body"></div>'
                + '</div>',

        maskTemplate: '<div class="dialog-mask"></div>',

        showAnimation: function () {
            this.element.show();
        },
        hideAnimation: function () {
            this.element.hide();
        },
        showMaskAnimation: function () {
            this.mask.show();
        },
        hideMaskAnimation: function () {
            this.mask.hide();
        },
        resizeAnimation: function (style) {
            this.element.css(style);
        }
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

    return Dialog;

});