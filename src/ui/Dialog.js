/**
 * @file Dialog
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var instance = require('../util/instance');

    var debounce = require('../function/debounce');
    var lifeCycle = require('../function/lifeCycle');
    var pageWidth = require('../function/pageWidth');
    var pageHeight = require('../function/pageHeight');
    var offsetParent = require('../function/offsetParent');

    var pinGlobal = require('../function/pinGlobal');
    var dragGlobal = require('../function/dragGlobal');

    /**
     * 对话框
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.mainElement 对话框元素，此配置可选
     *                                         如果传参，可把 title/content 写到模板上，把元素传进来
     *                                         如果未传，必须传 title/content
     *
     * @property {string=} options.mainTemplate 对话框模板
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
     * @property {boolean=} options.hideOnBlur 点击遮罩是否隐藏对话框，默认为 false
     * @property {number=} options.zIndex 不推荐使用这个，如果实在是被恶心的东西挡住了，只能加上一个更大的值
     *
     * @property {Function=} options.showAnimate 显示对话框动画
     * @property {Function=} options.hideAnimate 隐藏对话框动画
     * @property {Function=} options.resizeAnimate 窗口 resize 时调整窗口位置的动画
     * @property {Function=} options.resizeMaskAnimate 调整遮罩大小的动画
     *
     * @property {jQuery=} options.maskElement 遮罩元素
     * @property {string=} options.maskTemplate 如果没传遮罩，可传模板动态创建
     * @property {Function=} options.showMaskAnimate 显示遮罩动画
     * @property {Function=} options.hideMaskAnimate 隐藏遮罩动画
     *
     * @property {string=} options.skinClass 皮肤
     * @property {string=} options.draggableClass 可拖拽时给 mainElement 添加的 class
     * @property {string=} options.draggingClass 拖拽时给 mainElement 添加的 class
     *
     * @property {(string|Array)=} options.draggableHandleSelector 可拖拽的元素
     * @property {(string|Array)=} options.draggableCancelSelector 不可拖拽的元素
     *
     * @property {string=} options.headerSelector 头部元素
     * @property {string=} options.titleSelector 填充 title 的元素
     * @property {string=} options.closeSelector 点击可关闭对话框的元素
     * @property {string=} options.contentSelector 填充 content 的元素
     *
     */
    function Dialog(options) {
        lifeCycle.init(this, options);
    }

    var proto = Dialog.prototype;

    proto.type = 'Dialog';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;


        var mainElement = me.option('mainElement');
        if (!mainElement) {
            mainElement = $(me.option('mainTemplate'));
        }

        if (!offsetParent(mainElement).is('body')) {
            instance.body.append(mainElement);
        }



        var maskElement = me.option('maskElement');

        if (me.option('modal')) {

            if (!maskElement) {
                maskElement = $(me.option('maskTemplate'));
            }

            // 遮罩放到对话框前面
            // 这样在 z-index 相同的情况下，对话框还能位于遮罩上方
            mainElement.before(maskElement);

        }






        var classList = [ ];

        var skinClass = me.option('skinClass');
        if (skinClass) {
            classList.push(skinClass);
        }

        var draggableClass = me.option('draggableClass');
        if (me.option('draggable') && draggableClass) {
            classList.push(draggableClass);
        }

        if (classList.length > 0) {
            mainElement.addClass(
                classList.join(' ')
            );
        }





        var removeOnEmpty = me.option('removeOnEmpty');

        var title = me.option('title');
        if (title) {
            mainElement
            .find(
                me.option('titleSelector')
            )
            .html(title);
        }
        else if (removeOnEmpty) {
            mainElement
            .find(
                me.option('headerSelector')
            )
            .remove();
        }

        var content = me.option('content');
        var contentElement = mainElement.find(
            me.option('contentSelector')
        );

        if (content) {
            contentElement.html(content);
        }
        else if (removeOnEmpty) {
            contentElement.remove();
        }





        var style = { };

        var width = me.option('width');

        switch ($.type(width)) {
            case 'string':
            case 'number':
                style.width = width;
                break;
        }

        var position = me.option('fixed') ? 'fixed' : 'absolute';
        if (mainElement.css('position') !== position) {
            style.position = position;
        }

        if (maskElement) {

            var zIndexStyleName = 'z-index';

            var zIndex = me.option('zIndex');

            if (!$.isNumeric(zIndex)) {
                zIndex = maskElement.css(zIndexStyleName);
                if (!$.isNumeric(zIndex)) {
                    zIndex = 'auto';
                }
            }

            maskElement.css(zIndexStyleName, zIndex);

            style[ zIndexStyleName ] = zIndex;

        }

        mainElement.css(style);





        var clickType = 'click' + me.namespace();
        var hideHandler = $.proxy(me.hide, me);

        var closeSelector = me.option('closeSelector');
        if (closeSelector) {
            mainElement.on(clickType, closeSelector, hideHandler);
        }

        if (maskElement && me.option('hideOnBlur')) {
            maskElement.on(clickType, hideHandler);
        }

        if (me.option('disposeOnHide')) {
            me.after('hide', $.proxy(me.dispose, me));
        }

        if (me.option('hidden')) {
            me.hide();
        }
        else {
            me.show();
        }

        me.inner({
            main: mainElement,
            mask: maskElement
        });

    };

    /**
     * 显示对话框
     */
    proto.show = function () {
        this.set('hidden', false);
    };

    /**
     * 隐藏对话框
     */
    proto.hide = function () {
        this.set('hidden', true);
    };

    /**
     * 刷新对话框的位置和大小
     */
    proto.refresh = function () {

        var me = this;

        var isResize = arguments[0];

        if (!isResize || me.option('positionOnResize')) {

            var mainElement = me.inner('main');

            me.execute(
                isResize ? 'resizeAnimate' : 'refreshAnimate',
                {
                    mainElement: mainElement,
                    mainStyle: pinGlobal({
                        element: mainElement,
                        x: me.option('x'),
                        y: me.option('y'),
                        fixed: me.option('fixed')
                    })
                }
            );
        }

        var maskElement = me.inner('mask');
        if (maskElement) {
            me.execute(
                'resizeMaskAnimate',
                {
                    maskElement: maskElement,
                    maskStyle: {
                        width: pageWidth(),
                        height: pageHeight()
                    }
                }
            );
        }

    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        if (!me.get('hidden')) {
            me.hide();
        }

        var mainElement = me.inner('main');
        var maskElement = me.inner('mask');
        var namespace = me.namespace();

        mainElement.off(namespace);
        if (maskElement) {
            maskElement.off(namespace);
        }

        if (me.option('removeOnDispose')) {
            mainElement.remove();
            if (maskElement) {
                maskElement.remove();
            }
        }

    };

    lifeCycle.extend(proto);


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
        hideOnBlur: false,
        removeOnEmpty: true,
        disposeOnHide: true,
        removeOnDispose: true,
        positionOnResize: true,

        draggableClass: 'draggable',

        draggableHandleSelector: '.dialog-header',
        draggableCancelSelector: [ '.dialog-header h1', '.dialog-close' ],

        headerSelector: '.dialog-header',
        titleSelector: '.dialog-header h1',
        closeSelector: '.dialog-close',
        contentSelector: '.dialog-body',

        mainTemplate: '<div class="dialog">'
                    +     '<i class="dialog-close">&times;</i>'
                    +     '<div class="dialog-header"><h1></h1></div>'
                    +     '<div class="dialog-body"></div>'
                    + '</div>',

        maskTemplate: '<div class="dialog-mask"></div>',

        showAnimate: function (options) {
            options.mainElement.show();
        },
        hideAnimate: function (options) {
            options.mainElement.hide();
        },
        showMaskAnimate: function (options) {
            options.maskElement.show();
        },
        hideMaskAnimate: function (options) {
            options.maskElement.hide();
        },
        resizeMaskAnimate: function (options) {
            options.maskElement.css(options.maskStyle);
        },
        resizeAnimate: function (options) {
            options.mainElement.css(options.mainStyle);
        },
        refreshAnimate: function (options) {
            options.mainElement.css(options.mainStyle);
        }

    };

    Dialog.propertyUpdater = {

        hidden: function (hidden) {

            var me = this;

            var resizer = me.inner('resizer');
            if (resizer) {
                instance.window.off('resize', resizer);
                resizer = null;
            }

            var drager = me.inner('drager');
            if (drager) {
                drager.dispose();
                drager = null;
            }

            var mainElement = me.inner('main');
            var maskElement = me.inner('mask');

            if (hidden) {

                me.execute(
                    'hideAnimate',
                    {
                        mainElement: mainElement
                    }
                );

                if (maskElement) {
                    me.execute(
                        'hideMaskAnimate',
                        {
                            maskElement: maskElement
                        }
                    );
                }

            }
            else {

                instance.window.resize(
                    resizer =
                    debounce(
                        function () {
                            me.refresh(true);
                        },
                        50
                    )
                );

                if (me.option('draggable')) {
                    drager = dragGlobal({
                        element: mainElement,
                        handleSelector: me.option('draggableHandleSelector'),
                        cancelSelector: me.option('draggableCancelSelector'),
                        draggingClass: me.option('draggingClass')
                    });
                }

                // 因为 refresh 会设置 left top
                // 但是某些浏览器无法及时刷新 DOM，导致 Draggable 读出来的依然是 0 0
                // 所以这里换到 Draggable 后面调用
                me.refresh();

                me.execute(
                    'showAnimate',
                    {
                        mainElement: mainElement
                    }
                );

                if (maskElement) {
                    me.execute(
                        'showMaskAnimate',
                        {
                            maskElement: maskElement
                        }
                    );
                }

            }

            me.inner({
                resizer: resizer,
                drager: drager
            });

        }
    };


    return Dialog;

});