/**
 * @file Tooltip
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 鼠标悬浮元素，弹出提示浮层
     *
     * 提示出现的位置可通过 defaultOptions.placement 统一配置
     * 如个别元素需特殊处理，可为元素加上 placementAttribute 配置的属性改写全局配置
     *
     * 如全局希望浮层显示在触发元素下方，可配置 Tooltip.defaultOptions.placement = 'bottom';
     *
     * 但是有个别元素，显示在下方体验不好，假设 placementAttribute 配置为 `data-placement`，
     * 可在模板里写 <span data-placement="top">xx</span>
     *
     * 如果要实现箭头效果，有两种方式：
     *
     * 1. border 实现: 配置方位 className，如
     *
     *    {
     *        topClass: 'tooltip-up',
     *        bottomClass: 'tooltip-down'
     *    }
     *
     *    当显示在上方时，会给浮层元素加上 `tooltip-up`;
     *    当显示在下方时，会给浮层元素加上 `tooltip-down`;
     *
     *    接下来可用 border 实现三角形，但需注意的是，
     *    当箭头向上时，需要把 border-top-width 设置为 0，
     *    这样才可避免透明的上边框影响触发逻辑，其他方向同理
     *
     * 2. 通过 mainTemplate 和 update(options) 几乎可实现任何效果
     *
     * 如需要微调位置，比如不是上下左右，而是下方偏右，可参考如下配置：
     *
     * {
     *     placement: 'bottom,auto',
     *     bottomOffsetX: 20,  // 向右偏移 20px
     * }
     *
     */

    var split = require('../function/split');
    var position = require('../util/position');
    var toNumber = require('../function/toNumber');
    var debounce = require('../function/debounce');
    var pageWidth = require('../function/pageWidth');
    var pageHeight = require('../function/pageHeight');
    var offsetParent = require('../function/offsetParent');

    var Popup = require('../helper/Popup');

    var lifeUtil = require('../util/life');
    var window = require('../util/instance').window;

    /**
     * 工具提示
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.triggerElement 需要工具提示的元素
     * @property {string=} options.triggerSelector 如果传了选择器，可不传 triggerElement，转为使用事件代理
     *
     * @property {jQuery=} options.mainElement 提示浮层元素
     *                                         对于 Tooltip 来说，通常会配置 mainTemplate，而无需指定元素
     *
     * @property {string=} options.placement 提示元素出现的位置
     *                                       可选值包括 left right top bottom auto
     *                                       可组合使用 如 'bottom,auto'，表示先尝试 bottom，不行就 auto
     *
     * @property {string=} options.maxWidth 提示元素的最大宽度，优先从元素读取 maxWidthAttribute
     * @property {boolean=} options.share 是否共享一个元素
     *
     * @property {string=} options.skinAttribute 配置皮肤属性，显示 tooltip 之前，会从触发元素上读取该属性，并添加该 className
     * @property {string=} options.placementAttribute 配置方位属性，显示 tooltip 之前，会从触发元素上读取该属性，并添加该 className
     * @property {string=} options.maxWidthAttribute 配置最大宽度属性，显示 tooltip 之前，会从触发元素上读取该属性，并设置 max-width
     * @property {string=} options.offsetXAttribute 配置水平偏移属性，显示 tooltip 之前，会从触发元素上读取该属性，并设置偏移量
     * @property {string=} options.offsetYAttribute 配置垂直偏移属性，显示 tooltip 之前，会从触发元素上读取该属性，并设置偏移量
     *
     * @property {Function=} options.update 更新提示浮层的内容
     *
     * @property {string} options.showTrigger 显示的触发方式
     * @property {number=} options.showDelay 显示延时
     * @property {Function} options.showAnimation 显示动画
     *
     * @property {string} options.hideTrigger 隐藏的触发方式
     * @property {number=} options.hideDelay 隐藏延时
     * @property {Function} options.hideAnimation 隐藏动画
     *
     * @property {number=} options.gapX 提示层和触发元素之间的横向间距，如果为 0，提示会和元素贴在一起
     * @property {number=} options.gapY 提示层和触发元素之间的纵向间距，如果为 0，提示会和元素贴在一起
     *
     * @property {string=} options.topClass 设置上侧 class
     * @property {string=} options.rightClass 设置右侧 class
     * @property {string=} options.bottomClass 设置下侧 class
     * @property {string=} options.leftClass 设置左侧 class
     *
     * @property {number=} options.topOffsetX 设置上侧水平偏移量
     * @property {number=} options.topOffsetY 设置上侧垂直偏移量
     * @property {number=} options.rightOffsetX 设置右侧水平偏移量
     * @property {number=} options.rightOffsetY 设置右侧垂直偏移量
     * @property {number=} options.bottomOffsetX 设置下侧水平偏移量
     * @property {number=} options.bottomOffsetY 设置下侧垂直偏移量
     * @property {number=} options.leftOffsetX 设置左侧水平偏移量
     * @property {number=} options.leftOffsetY 设置左侧垂直偏移量
     *
     */
    function Tooltip(options) {
        lifeUtil.init(this, options);
    }

    var proto = Tooltip.prototype;

    proto.type = 'Tooltip';

    proto.init = function () {

        var me = this;

        me.initStruct();

        var mainElement = me.option('mainElement');
        var triggerElement = me.option('triggerElement');
        var triggerSelector = me.option('triggerSelector');

        if (!triggerElement && !triggerSelector) {
            me.error('triggerElement、triggerSelector 至少传一个吧！');
        }

        var hidden = me.option('hidden');
        var opened;
        if ($.type(hidden) === 'boolean') {
            opened = !hidden;
        }

        var popup = new Popup({
            layerElement: mainElement,
            triggerElement: triggerElement,
            triggerSelector: triggerSelector,
            showLayerTrigger: me.option('showTrigger'),
            showLayerDelay: me.option('showDelay'),
            hideLayerTrigger: me.option('hideTrigger'),
            hideLayerDelay: me.option('hideDelay'),
            opened: opened,
            showLayerAnimation: function () {
                me.execute(
                    'showAnimation',
                    {
                        mainElement: mainElement
                    }
                );
            },
            hideLayerAnimation: function () {
                me.execute(
                    'hideAnimation',
                    {
                        mainElement: mainElement
                    }
                );
            },
            watchSync: {
                opened: function (opened) {
                    me.state('hidden', !opened);
                }
            }
        });

        var namespace = me.namespace();

        popup
        .on('dispatch', function (e, data) {

            var event = e.originalEvent;
            var type = event.type;

            switch (type) {
                case 'beforeopen':
                    return;
                    break;
                case 'afteropen':
                    type = 'aftershow';
                    break;
                case 'beforeclose':
                    type = 'beforehide';
                    break;
                case 'afterclose':
                    type = 'afterhide';
                    window.off(namespace);
                    break;
            }

            event.type = type;

            me.dispatch(
                me.emit(event, data),
                data
            );

        })
        .before('open', function (e, data) {

            var event = e.originalEvent;
            if (!event || !event.target || !event.target.tagName) {
                return;
            }

            var skinClass = me.inner('skinClass');
            if (skinClass) {
                mainElement.removeClass(skinClass);
            }

            var placement = me.inner('placement');
            if (placement) {
                mainElement.removeClass(
                    me.option(placement + 'Class')
                );
            }

            var maxWidth = me.inner('maxWidth');
            if (maxWidth) {
                mainElement.css('max-width', '');
            }


            triggerElement = $(event.currentTarget);

            me.inner('trigger', triggerElement);

            var skinAttribute = me.option('skinAttribute');
            var placementAttribute = me.option('placementAttribute');
            var maxWidthAttribute = me.option('maxWidthAttribute');

            if (placementAttribute) {
                placement = triggerElement.attr(placementAttribute)
            }
            if (!placement) {
                placement = me.option('placement');
            }

            var placementList = getPlacementList(placement);

            placement = null;

            if (placementList.length > 0) {

                if (placementList.length === 1) {
                    placement = placementList[0];
                }
                else {
                    $.each(
                        placementList,
                        function (index, name) {
                            var tests = placementMap[ name ].test;
                            for (var i = 0, len = tests.length; i < len; i++) {
                                if (!tests[i].call(me)) {
                                    return;
                                }
                            }
                            placement = name;
                            return false;
                        }
                    );
                }

            }

            var clean = function () {
                me.inner({
                    skinClass: null,
                    placement: null,
                    maxWidth: null,
                    offsetX: null,
                    offsetY: null
                });
            };

            if (!placement) {
                clean();
                return false;
            }







            var update = function () {

                e.type = 'beforeshow';

                me.emit(e, data);
                me.dispatch(e, data);

                if (e.isDefaultPrevented()) {
                    clean();
                    return;
                }

                mainElement.addClass(
                    me.option(placement + 'Class')
                );

                skinClass = '';

                if (skinAttribute) {
                    skinClass = triggerElement.attr(skinAttribute);
                    if (skinClass) {
                        mainElement.addClass(skinClass);
                    }
                }

                // 确保 mainElement 是完整的展现在视口内
                // 这样才不会因为边界问题导致宽高计算失败
                var style = {
                    left: 0,
                    top: 0
                };

                maxWidth = '';

                if (maxWidthAttribute) {
                    maxWidth = triggerElement.attr(maxWidthAttribute);
                }
                if (!maxWidth) {
                    maxWidth = me.option('maxWidth');
                }

                if (maxWidth) {
                    style['max-width'] = maxWidth;
                }

                mainElement.css(style);

                var offsetXAttribute = me.option('offsetXAttribute');
                var offsetYAttribute = me.option('offsetYAttribute');

                var offsetX = offsetXAttribute
                            ? triggerElement.attr(offsetXAttribute)
                            : null;

                var offsetY = offsetYAttribute
                            ? triggerElement.attr(offsetYAttribute)
                            : null;

                me.inner({
                    skinClass: skinClass,
                    placement: placement,
                    maxWidth: maxWidth,
                    offsetX: offsetX,
                    offsetY: offsetY
                });

                me.pin();

                window.on(
                    'resize' + namespace,
                    debounce(
                        function () {
                            if (me.guid) {
                                me.pin();
                            }
                        },
                        50
                    )
                );

            };

            var promise = me.execute(
                'update',
                {
                    mainElement: mainElement,
                    triggerElement: triggerElement
                }
            );

            if (promise && $.isFunction(promise.then)) {
                promise.then(update);
            }
            else {
                update();
            }


        });




        me.inner({
            main: mainElement,
            popup: popup
        });

    };

    proto.show = function () {
        this.state('hidden', false);
    };

    proto.hide = function () {
        this.state('hidden', true);
    };

    proto.pin = function () {

        var me = this;
        var mainElement = me.inner('main');

        var options = {
            element: mainElement,
            attachment: me.inner('trigger'),
            offsetX: toNumber(me.option('gapX'), 0),
            offsetY: toNumber(me.option('gapY'), 0)
        };

        var placement = me.inner('placement');
        var target = placementMap[ placement ];
        if ($.isFunction(target.gap)) {
            target.gap(options);
        }

        var offset = placement + 'Offset';
        options.offsetX += toNumber(me.option(offset + 'X'), 0)
                         + toNumber(me.inner('offsetX'), 0);
        options.offsetY += toNumber(me.option(offset + 'Y'), 0)
                         + toNumber(me.inner('offsetY'), 0);

        position[ target.name ](options);

    };

    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.inner('popup').dispose();

        window.off(me.namespace());

    };

    lifeUtil.extend(proto, [ 'show', 'hide' ]);

    Tooltip.stateUpdater = {

        hidden: function (hidden) {
            var popup = this.inner('popup');
            if (hidden) {
                popup.close();
            }
            else {
                popup.open();
            }
        }

    };

    /**
     * 测试左侧
     *
     * @inner
     * @return {boolean}
     */
    function testLeft() {
        var mainElement = this.inner('main');
        var triggerElement = this.inner('trigger');
        return triggerElement.offset().left > mainElement.outerWidth();
    }

    /**
     * 测试右侧
     *
     * @inner
     * @return {boolean}
     */
    function testRight() {
        var mainElement = this.inner('main');
        var triggerElement = this.inner('trigger');
        return pageWidth() >
               (triggerElement.offset().left
               + triggerElement.outerWidth()
               + mainElement.outerWidth());
    }

    /**
     * 测试上侧
     *
     * @inner
     * @return {boolean}
     */
    function testTop() {
        var mainElement = this.inner('main');
        var triggerElement = this.inner('trigger');
        return triggerElement.offset().top > mainElement.outerHeight();
    }

    /**
     * 测试下侧
     *
     * @inner
     * @return {boolean}
     */
    function testBottom() {
        var mainElement = this.inner('main');
        var triggerElement = this.inner('trigger');
        return pageHeight() >
               (triggerElement.offset().top
                + triggerElement.outerHeight()
                + mainElement.outerHeight());
    }

    /**
     * 方位映射表
     *
     * @inner
     * @type {Object}
     */
    var placementMap = {

        bottom: {
            name: 'bottom',
            test: [ testBottom ],
            gap: function (options) {
                options.offsetX = 0;
            }
        },

        top: {
            name: 'top',
            test: [ testTop ],
            gap: function (options) {
                options.offsetY *= -1;
                options.offsetX = 0;
            }
        },

        right: {
            name: 'right',
            test: [ testRight ],
            gap: function (options) {
                options.offsetY = 0;
            }
        },

        left: {
            name: 'left',
            test: [ testLeft ],
            gap: function (options) {
                options.offsetX *= -1;
                options.offsetY = 0;
            }
        },

        topLeft: {
            name: 'topLeft',
            test: [testTop, testLeft],
            gap: function (options) {
                options.offsetX *= -1;
                options.offsetY *= -1;
            }
        },

        topRight: {
            name: 'topRight',
            test: [testTop, testRight],
            gap: function (options) {
                options.offsetY *= -1;
            }
        },

        bottomLeft: {
            name: 'bottomLeft',
            test: [testBottom, testLeft],
            gap: function (options) {
                options.offsetX *= -1;
            }
        },

        bottomRight: {
            name: 'bottomRight',
            test: [testBottom, testRight]
        }

    };

    /**
     * 获取方位的遍历列表
     *
     * placement 可能包含 auto
     * 解析方法是把 auto 之前的方位依次放入结果，再把 auto 转成剩余的方位
     *
     * @inner
     * @param {string} placement
     * @return {Array.<string>}
     */
    function getPlacementList(placement) {

        var result = [ ];

        $.each(
            split(placement, ','),
            function (index, name) {
                if (placementMap[name]) {
                    result.push(name);
                }
                else if (name === 'auto') {
                    $.each(
                        placementMap,
                        function (name) {
                            if ($.inArray(name, result) < 0) {
                                result.push(name);
                            }
                        }
                    );
                    return false;
                }
            }
        );

        return result;

    }


    return Tooltip;

});
