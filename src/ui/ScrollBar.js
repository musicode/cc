/**
 * @file ScrollBar
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     *
     * 通过隐藏原生滚动条，控制元素的 scrollTop/scrollLeft 实现滚动
     *
     * 核心逻辑分两块
     *
     * 1. 计算 视窗高度 / 内容高度，用这个比值渲染滚动滑块
     * 2. 计算 内容大小 / 滚动条大小，算出滑块每滚动 1px，内容元素滚动多少
     *
     * 注意：
     *
     * 1. 宽高必须用整形，否则涉及到浮点运算，很容易出现精度问题
     *    在滚动距离非常大时，这个问题会非常明显
     *
     */

    var getRaito = require('../function/ratio');

    var lifeCycle = require('../util/lifeCycle');
    var orientationMap = require('../util/orientation');

    var Slider = require('./Slider');

    /**
     * 自定义滚动条
     *
     * @property {Object} options
     *
     * @property {jQuery} options.mainElement 滚动条元素
     * @property {string=} options.mainTemplate 滚动条的模板，如果 mainElement 结构完整，可不传模板
     *
     * @property {jQuery} options.panelElement 滚动面板
     *
     * @property {number=} options.value 面板当前滚动的位置，不传则计算元素当前位置
     *
     * @property {string=} options.orientation 滚动方向，可选值有 horizontal 和 vertical，默认是 vertical
     * @property {number=} options.scrollStep 滚动的单位像素，默认是 20
     * @property {number=} options.minWidth 滚动条的最小宽度，当 orientation  为 horizontal 时生效
     * @property {number=} options.minHeight 滚动条的最小高度，当 orientation  为 vertical 时生效
     *
     * @property {string=} options.thumbSelector 从 mainTemplate 选中滑块的选择器
     *
     * @property {string=} options.draggingClass 拖拽滑块时的 class
     *
     * @property {Function=} options.showAnimate
     * @property {Function=} options.hideAnimate
     * @property {Function=} options.scrollAnimate
     */
    function ScrollBar(options) {
        lifeCycle.init(this, options);
    }

    var proto = ScrollBar.prototype;

    proto.type = 'ScrollBar';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        var orientation = me.option('orientation');
        var props = orientationMap[ orientation ];

        var mainElement = me.option('mainElement');
        var panelElement = me.option('panelElement');

        var slider = new Slider({
            minValue: 0,
            maxValue: 100,
            value: me.option('value'),
            mainElement: mainElement,
            mainTemplate: me.option('mainTemplate'),
            orientation: orientation,
            scrollElement: panelElement,
            scrollStep: me.option('scrollStep'),
            scrollStepType: me.option('scrollStepType'),
            thumbSelector: me.option('thumbSelector'),
            draggingClass: me.option('draggingClass'),
            slideAnimate: function (options) {
                me.execute(
                    'scrollAnimate',
                    options
                );
            },
            propertyChange: {
                value: function (value) {

                    var pixel = slider.valueToPixel(value);

                    panelElement.prop(
                        props.scrollPosition,
                        pixel * me.inner('ratio')
                    );

                    me.set('value', value);

                    me.emit('scroll');

                }
            }
        });

        me.inner({
            main: mainElement,
            slider: slider
        });

        me.refresh();

    };

    /**
     * 刷新滚动条
     */
    proto.refresh = function () {

        //
        // [建议]
        //
        // 某些浏览器（测试时是火狐）
        // 在 js 执行期间获取到的 scrollHeight
        // 和 js 执行完之后获取的 scrollHeight 不一样
        // 因此调用时最好设置一个延时，确保刷新时是最新的 DOM 树
        //

        var me = this;

        var slider = me.inner('slider');

        var orientation = me.option('orientation');
        var props = orientationMap[ orientation ];

        var mainElement = me.inner('main');
        var panelElement = me.option('panelElement');
        var viewportSize = panelElement[ props.innerSize ]();
        var contentSize = panelElement.prop(props.scrollSize);

        var ratio = getRaito(viewportSize, contentSize);

        if (ratio > 0 && ratio < 1) {

            me.execute(
                'showAnimate',
                {
                    mainElement: mainElement
                }
            );

            var trackElement = slider.inner('track');
            var thumbElement = slider.inner('thumb');

            var trackSize = trackElement[ props.innerSize ]();
            var thumbSize = trackSize * ratio;

            var minThumbSize = me.option(props.minSize);
            if (thumbSize < minThumbSize) {
                thumbSize = minThumbSize;
            }

            // 转成整数，为了避免结果是 0，这里使用向上取整
            thumbElement[ props.outerSize ](
                Math.ceil(thumbSize)
            );

            me.inner(
                'ratio',
                getRaito(viewportSize, trackSize)
            );

        }
        else {
            me.execute(
                'hideAnimate',
                {
                    mainElement: mainElement
                }
            );
        }

        slider.refresh();

    };

    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('slider').dispose();

    };

    lifeCycle.extend(proto);

    ScrollBar.defaultOptions = {
        scrollStep: 5,
        scrollStepType: 'pixel',
        orientation: 'vertical',
        minWidth: 10,
        minHeight: 10,
        mainTemplate: '<i class="scroll-thumb"></i>',
        thumbSelector: '.scroll-thumb',
        showAnimate: function (options) {
            options.mainElement.show();
        },
        hideAnimate: function (options) {
            options.mainElement.hide();
        },
        scrollAnimate: function (options) {
            options.thumbElement.css(
                options.thumbStyle
            );
        }
    };

    ScrollBar.propertyUpdater = {

        value: function (value) {
            this.inner('slider').set('value', value);
        }

    };

    return ScrollBar;

});
