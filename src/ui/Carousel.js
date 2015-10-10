/**
 * @file 轮播
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var toNumber = require('../function/toNumber');

    var Switchable = require('../helper/Switchable');
    var Iterator = require('../helper/Iterator');

    var lifeUtil = require('../util/life');

    /**
     * 轮播
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     *
     * @property {number} options.index 从第几个开始播放
     * @property {number} options.minIndex index 的最小值
     * @property {number} options.maxIndex index 的最大值
     *
     * @property {number} options.step 每次滚动几项（item）
     *
     * @property {number} options.interval 自动播放时，切换的时间间隔，单位毫秒
     * @property {boolean=} options.loop 是否循环播放
     * @property {boolean=} options.reverse 是否反向，正向是从左到右，反向是从右到左
     * @property {boolean=} options.autoplay 是否自动播放
     * @property {boolean=} options.pauseOnHover 鼠标 hover item 时是否暂停播放，从用户体验来看，为 true 比较好
     *
     * @property {string=} options.navTrigger 当有图标按钮时，触发改变的方式，可选值有 enter click
     * @property {string=} options.navDelay 当 navTrigger 是 enter 时，可以设置延时
     * @property {Function=} options.navAnimation 切换动画
     *
     * @property {string=} options.navSelector 图标按钮选择器（一般会写序号的小按钮）
     * @property {string=} options.navActiveClass
     *
     * @property {string} options.itemSelector 幻灯片选择器
     * @property {string=} options.itemActiveClass
     * @property {Function} options.itemAnimation 切换动画
     *
     * @property {string=} options.prevSelector 上一个按钮的选择器
     * @property {string=} options.nextSelector 下一个按钮的选择器
     *
     */
    function Carousel(options) {
        lifeUtil.init(this, options);
    }

    var proto = Carousel.prototype;

    proto.type = 'Carousel';

    proto.init = function () {

        var me = this;

        me.initStruct();

        var mainElement = me.option('mainElement');

        var namespace = me.namespace();
        var clickType = 'click' + namespace;

        var prevSelector = me.option('prevSelector');
        if (prevSelector) {
            mainElement.on(
                clickType,
                prevSelector,
                $.proxy(me.prev, me)
            );
        }

        var nextSelector = me.option('nextSelector');
        if (nextSelector) {
            mainElement.on(
                clickType,
                nextSelector,
                $.proxy(me.next, me)
            );
        }

        var itemSelector = me.option('itemSelector');
        if (me.option('autoplay')
            && me.option('pauseOnHover')
        ) {
            mainElement
                .on(
                    'mouseenter' + namespace,
                    itemSelector,
                    $.proxy(me.pause, me)
                )
                .on(
                    'mouseleave' + namespace,
                    itemSelector,
                    $.proxy(me.play, me)
                );
        }



        var navTrigger = me.option('navTrigger');
        var navSelector = me.option('navSelector');
        var navActiveClass = me.option('navActiveClass');

        var switcher;
        if (navTrigger && navSelector) {
            switcher = new Switchable({
                mainElement: mainElement,
                switchTrigger: navTrigger,
                switchDelay: me.option('navDelay'),
                itemSelector: navSelector,
                itemActiveClass: navActiveClass,
                propertyChange: {
                    index: function (toIndex, fromIndex) {

                        me.set('index', toIndex, { action: navTrigger });

                    }
                }
            });
        }

        var iterator = new Iterator({
            index: me.option('index'),
            minIndex: me.option('minIndex'),
            maxIndex: me.option('maxIndex'),
            interval: me.option('interval'),
            step: me.option('step'),
            loop: me.option('loop'),
            propertyChange: {
                index: function (toIndex, fromIndex, changes) {

                    me.set('index', toIndex, changes.index);

                    if (switcher) {
                        me.execute('navAnimation', {
                            mainElement: mainElement,
                            navSelector: navSelector,
                            navActiveClass: navActiveClass,
                            fromIndex: fromIndex,
                            toIndex: toIndex
                        });
                    }

                    me.execute('itemAnimation', {
                        mainElement: mainElement,
                        itemSelector: itemSelector,
                        itemActiveClass: me.option('itemActiveClass'),
                        fromIndex: fromIndex,
                        toIndex: toIndex
                    });

                },
                minIndex: function (minIndex) {
                    me.set('minIndex', minIndex);
                },
                maxIndex: function (maxIndex) {
                    me.set('maxIndex', maxIndex);
                }
            }
        });

        me.inner({
            main: mainElement,
            switcher: switcher,
            iterator: iterator
        });

    };

    proto.prev = function () {
        this.inner('iterator').prev();
    };

    proto.next = function () {
        this.inner('iterator').next();
    };

    proto.play = function () {
        this.inner('iterator').start(
            this.option('reverse')
        );
    };

    proto.pause = function () {
        this.inner('iterator').pause();
    };

    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.inner('iterator').dispose();

        var switcher = me.inner('switcher');
        if (switcher) {
            switcher.dispose();
        }

        me.inner('main').off(
            me.namespace()
        );

    };

    lifeUtil.extend(proto);

    Carousel.propertyUpdater = {

        index: function (index) {

            var me = this;

            me.inner('iterator').set('index', index);

            var switcher = me.inner('switcher');
            if (switcher) {
                switcher.set('index', index);
            }

            if (me.option('autoplay')) {
                me.play();
            }

        },
        minIndex: function (minIndex) {
            this.inner('iterator').set('minIndex', minIndex);
        },
        maxIndex: function (maxIndex) {
            this.inner('iterator').set('maxIndex', maxIndex);
        }

    };

    Carousel.propertyValidator = {

        minIndex: function (minIndex) {
            return toNumber(minIndex, 0);
        },
        maxIndex: function (maxIndex) {

            maxIndex = toNumber(maxIndex, null);

            if (maxIndex == null) {
                var me = this;
                var items = me.inner('main').find(
                    me.option('itemSelector')
                );
                maxIndex = items.length - 1;
            }

            return maxIndex;

        }

    };


    return Carousel;

});