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
    var isHidden = require('../function/isHidden');

    var lifeUtil = require('../util/life');
    var orientationUtil = require('../util/orientation');

    var Slider = require('./Slider');

    /**
     * 自定义滚动条
     *
     * @property {Object} options
     *
     * @property {jQuery} options.mainElement 滚动条主元素
     * @property {jQuery} options.panelElement 滚动面板元素
     *
     * @property {number=} options.value 当前滚动位置，可选区间为 0 - 100，不传则自动计算元素当前位置
     *
     * @property {string} options.orientation 滚动方向，可选值有 horizontal、vertical
     * @property {(number|Function)=} options.scrollStep 滚动的单位像素
     * @property {string=} options.scrollStepType 滚轮事件触发的步进类型，可选值是 value、pixel，不传是 pixel
     *
     * @property {number=} options.minWidth 滚动条的最小宽度，当 orientation 为 horizontal 时生效
     * @property {number=} options.minHeight 滚动条的最小高度，当 orientation 为 vertical 时生效
     *
     * @property {string} options.thumbSelector 滑块选择器
     * @property {string=} options.draggingClass 拖拽滑块时给 mainElement 添加的 className
     *
     * @property {Function} options.showAnimation
     * @property {Function} options.hideAnimation
     * @property {Function} options.scrollAnimation
     */
    function ScrollBar(options) {
        lifeUtil.init(this, options);
    }

    var proto = ScrollBar.prototype;

    proto.type = 'ScrollBar';

    proto.init = function () {

        var me = this;

        var orientation = me.option('orientation');
        var props = orientationUtil[ orientation ];

        var panelElement = me.option('panelElement');

        var slider = new Slider({
            minValue: 0,
            maxValue: 100,
            value: me.option('value'),
            mainElement: me.option('mainElement'),
            mainTemplate: me.option('mainTemplate'),
            orientation: orientation,
            scrollElement: panelElement,
            scrollStep: me.option('scrollStep'),
            scrollStepType: me.option('scrollStepType'),
            thumbSelector: me.option('thumbSelector'),
            draggingClass: me.option('draggingClass'),
            slideAnimation: function (options) {
                me.execute(
                    'scrollAnimation',
                    options
                );
            },
            watchSync: {
                value: function (value) {

                    var pixel = this.valueToPixel(value);

                    panelElement.prop(
                        props.scrollPosition,
                        pixel * me.inner('ratio')
                    );

                    me.set('value', value);

                }
            }
        });

        var dispatchEvent = function (e, data) {
            me.emit(e, data);
        };

        slider
            .on('beforedrag', dispatchEvent)
            .on('drag', dispatchEvent)
            .on('afterdrag', dispatchEvent);

        me.inner({
            main: slider.inner('main'),
            slider: slider
        });

        me.state('hidden', me.option('hidden'));

        me.refresh();

    };

    proto.show = function () {
        this.state('hidden', false);
    };

    proto._show = function () {
        if (!this.is('hidden')) {
            return false;
        }
    };

    proto.hide = function () {
        this.state('hidden', false);
    };

    proto._hide = function () {
        if (this.is('hidden')) {
            return false;
        }
    };

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
        var props = orientationUtil[ orientation ];

        var panelElement = me.option('panelElement');
        var viewportSize = panelElement[ props.innerSize ]();
        var contentSize = panelElement.prop(props.scrollSize);

        var ratio = getRaito(viewportSize, contentSize);
        if (ratio > 0 && ratio < 1) {

            me.show();

            var trackElement = slider.inner('track');
            var thumbElement = slider.inner('thumb');

            var trackSize = trackElement[ props.innerSize ]();
            var thumbSize = trackSize * ratio;

            var minThumbSize = me.option(props.minSize);
            if (thumbSize < minThumbSize) {
                thumbSize = minThumbSize;
            }

            thumbElement[ props.outerSize ](
                Math.round(thumbSize)
            );

            me.inner(
                'ratio',
                getRaito(contentSize, trackSize)
            );

        }
        else {
            me.hide();
        }

        slider.refresh();

    };

    proto.dispose = function () {

        lifeUtil.dispose(this);

        this.inner('slider').dispose();

    };

    lifeUtil.extend(proto);

    ScrollBar.propertyUpdater = {

        value: function (value) {
            this.inner('slider').set('value', value);
        }

    };

    ScrollBar.stateUpdater = {

        hidden: function (hidden) {
            this.execute(
                hidden ? 'hideAnimation' : 'showAnimation',
                {
                    mainElement: this.inner('main')
                }
            );
        }

    };

    ScrollBar.stateValidator = {

        hidden: function (hidden) {
            if ($.type(hidden) !== 'boolean') {
                hidden = isHidden(
                    this.inner('main')
                );
            }
            return hidden;
        }

    };


    return ScrollBar;

});
