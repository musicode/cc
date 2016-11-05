/**
 * @file Dialog
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var contains = require('../function/contains');
    var debounce = require('../function/debounce');
    var pageWidth = require('../function/pageWidth');
    var pageHeight = require('../function/pageHeight');

    var pinGlobal = require('../function/pinGlobal');
    var dragGlobal = require('../function/dragGlobal');

    var lifeUtil = require('../util/life');
    var window = require('../util/instance').window;

    /**
     * 对话框
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.mainElement 对话框元素
     * @property {string=} options.mainTemplate 对话框模板
     *
     * @property {string=} options.title 对话框标题模板
     * @property {string=} options.content 对话框内容模板
     * @property {string=} options.footer 对话框底部模板
     *
     * @property {(number|string)=} options.width 对话框整体宽度
     * @property {(number|string)=} options.x 对话框的 x 位置，可以是 数字(10) 或 百分比(50%)
     * @property {(number|string)=} options.y 对话框的 y 位置，可以是 数字(10) 或 百分比(50%)
     *
     * @property {boolean=} options.hidden 对话框初始化是否默认隐藏
     * @property {boolean=} options.fixed 对话框是否是 fixed 定位
     * @property {boolean=} options.modal 对话框是否模态
     * @property {boolean=} options.draggable 对话框是否可拖拽，拖拽位置需要用 draggableIncludeSelector 和 draggableExcludeSelector 配置
     * @property {boolean=} options.removeClose 是否不需要关闭按钮
     * @property {boolean=} options.removeOnEmpty 当 title 或 content 为空时，是否隐藏 header 或 body 或 footer 元素
     * @property {boolean=} options.disposeOnHide 是否隐藏时销毁控件
     * @property {boolean=} options.removeOnDispose 销毁时是否移除元素
     * @property {boolean=} options.hideOnClickMask 点击遮罩是否隐藏对话框
     * @property {number=} options.zIndex 不推荐使用这个，如果实在是被恶心的东西挡住了，只能加上一个更大的值
     *
     * @property {Function} options.showAnimation 显示对话框和遮罩动画
     * @property {Function} options.hideAnimation 隐藏对话框和遮罩动画
     * @property {Function} options.dragAnimation 拖拽对话框移动的动画
     * @property {Function} options.refreshAnimation 调用 refresh() 时调整对话框和遮罩的动画
     * @property {Function} options.resizeWindowAnimation 浏览器 resize 时调整对话框和遮罩的动画
     *
     * @property {jQuery=} options.maskElement 遮罩元素
     * @property {string=} options.maskTemplate 如果没传 maskElement，可传模板动态创建
     *
     * @property {string=} options.skinClass 皮肤
     * @property {string=} options.draggableClass 如果对话框可拖拽，给 mainElement 添加的 className
     * @property {string=} options.draggingClass 拖拽时给 mainElement 添加的 className
     *
     * @property {(string|Array)=} options.draggableIncludeSelector 可拖拽的元素
     * @property {(string|Array)=} options.draggableExcludeSelector 不可拖拽的元素
     *
     * @property {string=} options.headerSelector 头部元素
     * @property {string=} options.contentSelector 填充 content 的元素
     * @property {string=} options.footerSelector 填充 footer 的元素
     *
     * @property {string=} options.titleSelector 填充 title 的元素
     * @property {string=} options.closeSelector 点击可关闭对话框的元素
     *
     */
    function Dialog(options) {
        lifeUtil.init(this, options);
    }

    var proto = Dialog.prototype;

    proto.type = 'Dialog';

    proto.init = function () {

        var me = this;

        me.initStruct();

        var mainElement = me.option('mainElement');
        var maskElement = me.option('maskElement');

        if (me.option('modal')) {

            if (!maskElement) {
                maskElement = $(me.option('maskTemplate'));
            }

            // 遮罩放到对话框前面
            // 这样在 z-index 相同的情况下，对话框还能位于遮罩上方

            // Bootstrap 的结构居然是 .mask > .dialog，这里可以兼容一下
            if (!contains(maskElement, mainElement)) {
                mainElement.before(maskElement);
            }

        }
        else if (maskElement) {
            maskElement = null;
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

        $.each(
            [ 'content', 'footer' ],
            function (index, name) {
                var value = me.option(name);
                var selector = me.option(name + 'Selector');
                if (value) {
                    mainElement
                        .find(selector)
                        .html(value);
                }
                else if (removeOnEmpty) {
                    mainElement
                        .find(selector)
                        .remove();
                }
            }
        );

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

        var closeSelector = me.option('closeSelector');
        if (me.option('removeClose')) {
            mainElement
                .find(closeSelector)
                .remove();
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

        if (closeSelector) {
            mainElement.on(
                clickType,
                closeSelector,
                $.proxy(me.hide, me)
            );
        }

        if (me.option('disposeOnHide')) {
            me.on('statechange', function (e, change) {
                var hidden = change.hidden;
                if (hidden
                    && hidden.newValue === true
                    && hidden.oldValue === false
                ) {
                    me.dispose();
                }
            });
        }

        if (maskElement) {
            if (me.option('hideOnClickMask')) {
                maskElement.on(clickType, function (e) {
                    if (!contains(mainElement, e.target)) {
                        me.hide();
                    }
                });
            }
            if (me.option('removeOnDispose')) {
                me.after('dispose', function () {
                    maskElement.remove();
                });
            }
        }


        me.inner({
            main: mainElement,
            mask: maskElement
        });

        var hidden = me.option('hidden');
        if (hidden) {
            me.hide();
        }
        else {
            me.show();
        }

    };


    proto.show = function () {
        this.state('hidden', false);
    };

    proto._show = function () {
        if (this.is('hidden') === false) {
            return false;
        }
    };


    proto.hide = function () {
        this.state('hidden', true);
    };

    proto._hide = function () {
        if (this.is('hidden') === true) {
            return false;
        }
    };


    proto.refresh = function () {

        var me = this;

        var options = { };

        var mainElement = me.inner('main');

        options.mainElement = mainElement;
        options.mainStyle = pinGlobal({
            element: mainElement,
            x: me.option('x'),
            y: me.option('y'),
            fixed: me.option('fixed')
        });

        var maskElement = me.inner('mask');
        if (maskElement) {
            options.maskElement = maskElement;
            options.maskStyle = {
                width: pageWidth(),
                height: pageHeight()
            };
        }

        me.execute(
            arguments[0] ? 'resizeWindowAnimation' : 'refreshAnimation',
            options
        );

    };

    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        if (!me.is('hidden')) {
            me.hide();
        }

        var maskElement = me.inner('mask');
        if (maskElement) {
            maskElement.off(me.namespace());
        }

    };

    lifeUtil.extend(proto);

    Dialog.stateUpdater = {

        hidden: function (hidden) {

            var me = this;
            var namespace = me.namespace();

            window.off(namespace);

            var dragger = me.inner('dragger');
            if (dragger) {
                dragger.dispose();
                dragger = null;
            }

            var mainElement = me.inner('main');
            var maskElement = me.inner('mask');

            var options = {
                mainElement: mainElement
            };
            if (maskElement) {
                options.maskElement = maskElement;
            }

            if (hidden) {
                me.execute(
                    'hideAnimation',
                    options
                );
            }
            else {

                window.on(
                    'resize' + namespace,
                    debounce(
                        function () {
                            me.refresh(true);
                        },
                        50
                    )
                );

                if (me.option('draggable')) {
                    dragger = dragGlobal({
                        element: mainElement,
                        includeSelector: me.option('draggableIncludeSelector'),
                        excludeSelector: me.option('draggableExcludeSelector'),
                        draggingClass: me.option('draggingClass'),
                        dragAnimation: me.option('dragAnimation')
                    });
                }

                me.execute(
                    'showAnimation',
                    options
                );

                me.refresh();

            }

            me.inner('dragger', dragger);

        }
    };


    return Dialog;

});