/**
 * @file Dialog
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 事件列表：
     *
     * 1. beforeShow - 返回 false 可阻止显示
     * 2. afterShow
     * 3. beforeHide - 返回 false 可阻止隐藏
     * 4. afterHide
     */

    var instance = require('../util/instance');
    var dimension = require('../util/dimension');

    var aspect = require('../function/aspect');
    var isHidden = require('../function/isHidden');
    var debounce = require('../function/debounce');
    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var offsetParent = require('../function/offsetParent');

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
     * @property {string=} options.template 对话框模板
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
     * @property {boolean=} options.positionOnResize 触发 resize 事件时是否重定位
     * @property {boolean=} options.removeOnEmpty 当 title 或 content 为空时，是否隐藏 header 或 body 元素
     * @property {boolean=} options.disposeOnHide 是否隐藏时销毁控件，默认为 true
     * @property {boolean=} options.removeOnDispose 销毁时是否移除元素，默认为 true
     * @property {boolean=} options.hideOnClickMask 点击遮罩是否隐藏对话框，默认为 false
     * @property {number=} options.zIndex 不推荐使用这个，如果实在是被恶心的东西挡住了，只能加上一个更大的值
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
     * @property {string=} options.headerSelector 头部元素
     * @property {string=} options.titleSelector 填充 title 的元素
     * @property {string=} options.closeSelector 点击可关闭对话框的元素
     * @property {string=} options.bodySelector 填充 content 的元素
     *
     */
    function Dialog(options) {
        return lifeCycle.init(this, options);
    }

    var proto = Dialog.prototype;

    proto.type = 'Dialog';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        var element = me.element;

        if (!element) {
            element =
            me.element = $(me.template);
        }

        if (!offsetParent(element).is('body')) {
            instance.body.append(element);
        }

        var maskElement = me.mask;

        if (me.modal) {

            if (!maskElement) {
                maskElement =
                me.mask = $(me.maskTemplate);
            }

            // 遮罩放到对话框前面
            // 这样在 z-index 相同的情况下，对话框还能位于遮罩上方
            element.before(maskElement);

        }





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





        var style = { };

        switch ($.type(me.width)) {
            case 'string':
            case 'number':
                style.width = me.width;
                break;
        }

        var position = me.fixed ? 'fixed' : 'absolute';
        if (element.css('position') !== position) {
            style.position = position;
        }

        if (maskElement) {

            var zIndexStyleName = 'z-index';

            var zIndex = me.zIndex;

            if (!$.isNumeric(zIndex)) {
                zIndex = maskElement.css(zIndexStyleName);
                if (!$.isNumeric(zIndex)) {
                    zIndex = 'auto';
                }
            }

            maskElement.css(zIndexStyleName, zIndex);

            style[ zIndexStyleName ] = zIndex;

        }

        element.css(style);





        var clickType = 'click' + namespace;
        var hideHandler = $.proxy(me.hide, me);


        var closeSelector = me.closeSelector;
        if (closeSelector) {
            element.on(clickType, closeSelector, hideHandler);
        }

        if (me.hideOnClickMask && maskElement) {
            maskElement.on(clickType, hideHandler);
        }

        if (me.disposeOnHide) {
            me.on('afterHide' + namespace, function () {
                me.dispose();
            });
        }


        var hidden = me.hidden;

        me.hidden = !hidden;
        me[ hidden ? 'hide' : 'show' ]();

    };

    /**
     * 显示对话框
     */
    proto.show = function () {

        var me = this;

        instance.window.resize(
            me.resizer =
            debounce(
                function () {
                    me.refresh(true);
                },
                50
            )
        );

        if (me.draggable) {
            me.drager = dragGlobal({
                element: me.element,
                handleSelector: me.draggableHandleSelector,
                cancelSelector: me.draggableCancelSelector,
                draggingClass: me.draggingClass,
                fixed: me.fixed,
                scrollable: true
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

    };

    /**
     * 隐藏对话框
     */
    proto.hide = function () {

        var me = this;

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

    };

    /**
     * 刷新对话框的位置和大小
     */
    proto.refresh = function () {

        var me = this;

        var isResize = arguments[0];

        if (!isResize || me.positionOnResize) {

            var style = pinGlobal({
                element: me.element,
                x: me.x,
                y: me.y,
                fixed: me.fixed
            });

            if (isResize) {
                me.resizeAnimation(style);
            }
            else {
                me.refreshAnimation(style);
            }

        }

        var maskElement = me.mask;
        if (maskElement) {
            maskElement.css({
                width: dimension.getPageWidth(),
                height: dimension.getPageHeight()
            });
        }

    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        if (!me.hidden) {
            me.hide();
        }

        var element = me.element;
        var maskElement = me.mask;

        element.off(namespace);
        if (maskElement) {
            maskElement.off(namespace);
        }

        if (me.removeOnDispose) {
            element.remove();
            if (maskElement) {
                maskElement.remove();
            }
        }

        me.element =
        me.mask = null;

    };

    jquerify(proto);

    aspect(proto, 'show', function () {
        return this.hidden;
    });

    aspect(proto, 'hide', function () {
        return !this.hidden;
    });

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
        },
        refreshAnimation: function (style) {
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


    return Dialog;

});