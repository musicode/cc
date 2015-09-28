/**
 * @file Tooltip
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 鼠标悬浮元素，弹出提示浮层
     *
     * 鉴于需求较多，可通过 Tooltip.defaultOptions 进行配置
     *
     * 提示出现的位置可通过 defaultOptions.placement 统一配置
     * 如个别元素需特殊处理，可为元素加上 data-placement 属性改写全局配置
     *
     * 如全局希望浮层显示在触发元素下方，可配置 Tooltip.defaultOptions.placement = 'bottom';
     *
     * 但是有个别元素，显示在下方体验不好，可在模板里写 <span data-placement="top">xx</span>
     *
     * 如果要实现箭头效果，有两种方式：
     *
     * 1. border 实现: 配置方位 class，如
     *
     *    {
     *        topClass: 'tooltip-up',
     *        bottomClass: 'tooltip-down'
     *    }
     *
     *    当显示在上方时，会给浮层元素加上 `tooltip-up` class;
     *    当显示在下方时，会给浮层元素加上 `tooltip-down` class;
     *
     *    接下来可用 border 实现三角形，但需注意的是，
     *    当箭头向上时，需要把 border-top-width 设置为 0，
     *    这样才可避免透明的上边框影响触发逻辑，其他方向同理
     *
     *
     *
     * 如需要微调位置，比如不是上下左右，而是下方偏右，可参考如下配置：
     *
     * {
     *     placement: 'bottom,auto',
     *     bottomOffset: {
     *         x: 20,   // 向右偏移 20px
     *         y: 0
     *     }
     * }
     *
     * 如果实例化的 template 参数和 defaultOptions.mainTemplate 不同，会在实例上新建一个 main 属性
     *
     * 如果想控制提示浮层的最大宽度，可以在触发元素上加 data-width="100px"
     *
     */

    /**
     * @update
     *
     * 1. 鉴于全局元素比较多，而且通常有动态创建的元素的场景，因此改成事件代理
     *
     * 2. 为了减少元素数量，同一个模板改为元素共享
     */

    var split = require('../function/split');
    var position = require('../util/position');
    var isHidden = require('../function/isHidden');
    var debounce = require('../function/debounce');
    var pageWidth = require('../function/pageWidth');
    var pageHeight = require('../function/pageHeight');
    var offsetParent = require('../function/offsetParent');

    var Popup = require('../helper/Popup');

    var instance = require('../util/instance');
    var lifeCycle = require('../util/lifeCycle');

    /**
     * 工具提示
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.triggerElement 需要工具提示的元素
     * @property {string=} options.triggerSelector 如果传了选择器，表示为 triggerElement 的 triggerSelector 元素进行事件代理
     *
     * @property {jQuery=} options.mainElement 提示浮层元素，这个配置用于应付比较复杂的场景，如浮层视图里有交互
     *                                         简单场景可用 mainTemplate 配置搞定
     * @property {string=} options.mainTemplate 提示元素的模版，可配合使用 placementClass, onBeforeShow 实现特殊需求
     *
     * @property {string=} options.placement 提示元素出现的位置
     *                                       可选值包括 left right top bottom topLeft topRight bottomLeft bottomRight auto
     *                                       可组合使用 如 'bottom,auto'，表示先尝试 bottom，不行就 auto
     *
     * @property {string=} options.maxWidth 提示元素的最大宽度
     * @property {boolean=} options.share 是否共享一个元素，默认是 true
     *
     * @property {Function} options.update 更新提示浮层的内容
     *
     * @property {string=} options.showTrigger 显示的触发方式
     * @property {number=} options.showDelay 显示延时
     * @property {Function=} options.showAnimation 显示动画
     *
     * @property {string=} options.hideTrigger 隐藏的触发方式
     * @property {number=} options.hideDelay 隐藏延时
     * @property {Function=} options.hideAnimation 隐藏动画
     *
     * @property {number=} options.gapX 提示层和触发元素之间的横向间距，如果为 0，提示会和元素贴在一起
     * @property {number=} options.gapY 提示层和触发元素之间的纵向间距，如果为 0，提示会和元素贴在一起
     *
     * @property {Object=} options.topClass 设置上侧 class
     * @property {Object=} options.rightClass 设置右侧 class
     * @property {Object=} options.bottomClass 设置下侧 class
     * @property {Object=} options.leftClass 设置左侧 class
     * @property {Object=} options.topLeftClass 设置左上侧 class
     * @property {Object=} options.topRightClass 设置右上侧 class
     * @property {Object=} options.bottomLeftClass 设置左下侧 class
     * @property {Object=} options.bottomRightClass 设置右下侧 class
     *
     * @property {Object=} options.topOffsetX 设置上侧偏移量
     * @property {Object=} options.topOffsetY 设置上侧偏移量
     * @property {Object=} options.rightOffsetX 设置右侧偏移量
     * @property {Object=} options.rightOffsetY 设置右侧偏移量
     * @property {Object=} options.bottomOffsetX 设置下侧偏移量
     * @property {Object=} options.bottomOffsetY 设置下侧偏移量
     * @property {Object=} options.leftOffsetX 设置左侧偏移量
     * @property {Object=} options.leftOffsetY 设置左侧偏移量
     * @property {Object=} options.topLeftOffsetX 设置左上侧偏移量
     * @property {Object=} options.topLeftOffsetY 设置左上侧偏移量
     * @property {Object=} options.topRightOffsetX 设置右上侧偏移量
     * @property {Object=} options.topRightOffsetY 设置右上侧偏移量
     * @property {Object=} options.bottomLeftOffsetX 设置左下侧偏移量
     * @property {Object=} options.bottomLeftOffsetY 设置左下侧偏移量
     * @property {Object=} options.bottomRightOffsetX 设置右下侧偏移量
     * @property {Object=} options.bottomRightOffsetY 设置右下侧偏移量
     *
     */
    function Tooltip(options) {
        lifeCycle.init(this, options);
    }

    var proto = Tooltip.prototype;

    proto.type = 'Tooltip';


    proto.init = function () {

        var me = this;

        me.initStructure();

        var triggerElement = me.option('triggerElement');
        var mainElement = me.option('mainElement');

        var popup = new Popup({
            hidden: true,
            layerElement: mainElement,
            triggerElement: triggerElement,
            triggerSelector: me.option('triggerSelector'),
            showLayerTrigger: me.option('showTrigger'),
            showLayerDelay: me.option('showDelay'),
            hideLayerTrigger: me.option('hideTrigger'),
            hideLayerDelay: me.option('hideDelay'),
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

            }
        });

        var dispatchEvent = function (e) {
            if (e.target.tagName) {
                me.emit(e);
            }
        };

        var resizeHandler;

        popup
        .before('open', function (e) {

            var originElement = e.originElement;
            if (!originElement || !originElement.tagName) {
                return;
            }

            var skinClass;
            var sourceElement = mainElement.source;

            if (sourceElement) {
                skinClass = sourceElement.attr('data-skin');
                if (skinClass) {
                    mainElement.removeClass(skinClass);
                }
            }

            sourceElement =
            mainElement.source = $(originElement);

            skinClass = sourceElement.attr('data-skin');
            if (skinClass) {
                mainElement.addClass(skinClass);
            }







            var placementList = getPlacementList(
                sourceElement.attr('data-placement')
                || me.option('placement')
            );

            var placement;

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

            if (!placement) {
                return false;
            }







            var updateLayer = function () {

                dispatchEvent(e);

                if (e.isDefaultPrevented()) {
                    return;
                }

                var maxWidth = sourceElement.attr('data-width')
                            || me.option('maxWidth');

                if (maxWidth) {
                    mainElement.css('max-width', maxWidth);
                }

                me.pin(placement);

                instance.window.resize(
                    resizeHandler =
                    debounce(
                        function () {
                            if (me.popup) {
                                me.pin(placement);
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
                    triggerElement: sourceElement
                }
            );

            if (promise && $.isFunction(promise.then)) {
                promise.then(updateLayer);
            }
            else {
                updateLayer();
            }


        })
        .after('open', dispatchEvent)
        .before('close', dispatchEvent)
        .after('close', function (e) {

            if (resizeHandler) {
                instance.window.off('resize', resizeHandler);
                resizeHandler = null;
            }

            dispatchEvent(e);

        });




        me.inner({
            main: mainElement,
            popup: popup
        })

    };

    proto.open = function () {
        this.inner('popup').open();
    };

    proto._open = function () {
        if (!this.inner('popup').is('hidden')) {
            return false;
        }
    };

    proto.close = function () {
        this.inner('popup').close();
    };

    proto._close = function () {
        if (this.inner('popup').is('hidden')) {
            return false;
        }
    };

    /**
     * 定位
     *
     * @param {string} placement 方位，可选值有 topLeft     top    topRight
     *                                        left               right
     *                                        bottomLeft bottom  bottomRight
     *
     */
    proto.pin = function (placement) {

        var me = this;
        var mainElement = me.inner('main');

        // 先设置好样式，再定位
        // 这样才能保证定位计算不会出问题

        var placementClass = mainElement.data(placementClassKey);
        if (placementClass) {
            mainElement
            .removeClass(placementClass)
            .removeData(placementClassKey);
        }

        placementClass = me.option(placement + 'Class');
        if (placementClass) {
            mainElement
            .addClass(placementClass)
            .data(placementClassKey, placementClass);
        }



        // 定位条件

        var options = {
            element: mainElement,
            attachment: mainElement.source,
            offsetX: 0,
            offsetY: 0
        };

        var gapX = me.option('gapX');
        if ($.type(gapX) === 'number') {
            options.offsetX = gapX;
        }

        var gapY = me.option('gapY');
        if ($.type(gapY) === 'number') {
            options.offsetY = gapY;
        }

        var target = placementMap[ placement ];
        if ($.isFunction(target.gap)) {
            target.gap(options);
        }

        var offsetX = me.option(placement + 'OffsetX');
        if ($.type(offsetX) === 'number') {
            options.offsetX += offsetX;
        }

        var offsetY = me.option(placement + 'OffsetY');
        if ($.type(offsetY) === 'number') {
            options.offsetY += offsetY;
        }


        position[ target.name ](options);


    };

    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('popup').dispose();

    };

    lifeCycle.extend(proto);

    Tooltip.defaultOptions = {

        showTrigger: 'enter',
        showDelay: 100,
        showAnimation: function (options) {
            options.mainElement.show();
        },

        hideTrigger: 'leave,click',
        hideDelay: 100,
        hideAnimation: function (options) {
            options.mainElement.hide();
        },

        mainTemplate: '<div class="tooltip tooltip-inverted"></div>',

        share: true,
        underBody: true,
        placement: 'auto',

        topClass: 'tooltip-top',
        rightClass: 'tooltip-right',
        bottomClass: 'tooltip-bottom',
        leftClass: 'tooltip-left',
        topLeftClass: 'tooltip-top-left',
        topRightClass: 'tooltip-top-right',
        bottomLeftClass: 'tooltip-bottom-left',
        bottomRightClass: 'tooltip-bottom-right',

        gapX: 10,
        gapY: 10,

        update: function (options) {

            options.mainElement.html(
                options.triggerElement.attr('data-title')
            );

        }

    };

    /**
     * 测试左侧
     *
     * @inner
     * @return {boolean}
     */
    function testLeft() {
        var main = this.inner('main');
        return main.source.offset().left > main.outerWidth();
    }

    /**
     * 测试右侧
     *
     * @inner
     * @return {boolean}
     */
    function testRight() {
        var main = this.inner('main');
        var source = main.source;
        return pageWidth() >
               (source.offset().left
               + source.outerWidth()
               + main.outerWidth());
    }

    /**
     * 测试上侧
     *
     * @inner
     * @return {boolean}
     */
    function testTop() {
        var main = this.inner('main');
        return main.source.offset().top > main.outerHeight();
    }

    /**
     * 测试下侧
     *
     * @inner
     * @return {boolean}
     */
    function testBottom() {
        var main = this.inner('main');
        var source = main.source;
        return pageHeight() >
               (source.offset().top
                + source.outerHeight()
                + main.outerHeight());
    }

    /**
     * 方位映射表
     *
     * @inner
     * @type {Object}
     */
    var placementMap = {

        bottom: {
            name: 'bottomCenter',
            test: [ testBottom ],
            gap: function (options) {
                options.offsetX = 0;
            }
        },

        top: {
            name: 'topCenter',
            test: [ testTop ],
            gap: function (options) {
                options.offsetY *= -1;
                options.offsetX = 0;
            }
        },

        right: {
            name: 'middleRight',
            test: [ testRight ],
            gap: function (options) {
                options.offsetY = 0;
            }
        },

        left: {
            name: 'middleLeft',
            test: [ testLeft ],
            gap: function (options) {
                options.offsetX *= -1;
                options.offsetY = 0;
            }
        },

        bottomLeft: {
            name: 'bottomLeft',
            test: [ testBottom, testLeft ],
            gap: function (options) {
                options.offsetX *= -1;
            }
        },

        bottomRight: {
            name: 'bottomRight',
            test: [ testBottom, testRight ]
        },

        topLeft: {
            name: 'topLeft',
            test: [ testTop, testLeft ],
            gap: function (options) {
                options.offsetX *= -1;
                options.offsetY *= -1;
            }
        },

        topRight: {
            name: 'topRight',
            test: [ testTop, testRight ],
            gap: function (options) {
                options.offsetY *= -1;
            }
        }
    };

    /**
     * 每个模板对应一个元素，这样可以少创建很多元素
     *
     * @inner
     * @type {Object}
     */
    var templateElementMap = { };

    /**
     * 存储当前方位 className 的 key
     *
     * @inner
     * @type {string}
     */
    var placementClassKey = '__placement__';

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
                else {
                    // 没匹配到的唯一情况是 auto
                    $.each(
                        placementMap,
                        function (name, value) {
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
