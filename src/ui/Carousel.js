/**
 * @file 轮播
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var Switchable = require('../helper/Switchable');
    var Iterator = require('../helper/Iterator');

    var lifeCycle = require('../util/lifeCycle');

    /**
     * 轮播
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     *
     * @property {number} options.index 从第几个开始播放，默认是 0
     * @property {number=} options.minIndex index 的最小值
     * @property {number=} options.maxIndex index 的最大值
     *
     * @property {number=} options.step 每次滚动几个，默认是 1
     *
     * @property {number=} options.interval 自动播放时，切换的时间间隔，默认 5000
     * @property {boolean=} options.autoplay 是否自动播放，默认 true
     * @property {boolean=} options.loop 是否循环播放，默认为 true
     * @property {boolean=} options.pauseOnHover 是否鼠标 hover 时暂停播放，默认为 true
     *
     * @property {string=} options.navTrigger 当有图标按钮时，触发改变的方式，可选值有 enter click， 默认是 enter
     * @property {string=} options.navDelay 当 navTrigger 是 enter 时，可以设置延时
     *
     * @property {string=} options.navSelector 图标按钮选择器（一般会写序号的小按钮）
     * @property {string=} options.navActiveClass 转场时会为当前 navItem 切换这个 className
     * @property {Function} options.navAnimate
     *
     * @property {string} options.itemSelector 幻灯片选择器
     * @property {string=} options.itemActiveClass
     * @property {Function} options.itemAnimate 切换动画，必传，否则不会动
     *
     * @property {string=} options.prevSelector 上一页的选择器
     * @property {string=} options.nextSelector 下一页的选择器
     *
     */
    function Carousel(options) {
        lifeCycle.init(this, options);
    }

    var proto = Carousel.prototype;

    proto.type = 'Carousel';

    proto.init = function () {

        var me = this;

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

        if (me.option('autoplay')
            && me.option('pauseOnHover')
        ) {
            var itemSelector = me.option('itemSelector');
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

        var switcher = new Switchable({
            mainElement: mainElement,
            switchTrigger: navTrigger,
            switchDelay: me.option('navDelay'),
            itemSelector: navSelector,
            itemActiveClass: navActiveClass,
            change: {
                index: function (toIndex, fromIndex) {

                    me.execute('navAnimate', {
                        mainElement: mainElement,
                        navSelector: navSelector,
                        navActiveClass: navActiveClass,
                        fromIndex: fromIndex,
                        toIndex: toIndex
                    });

                    me.execute('itemAnimate', {
                        mainElement: mainElement,
                        itemSelector: me.option('itemSelector'),
                        itemActiveClass: me.option('itemActiveClass'),
                        fromIndex: fromIndex,
                        toIndex: toIndex
                    });

                    me.set('index', toIndex, { action: navTrigger });

                }
            }
        });

        var iterator = new Iterator({
            interval: me.option('interval'),
            loop: me.option('loop'),
            step: me.option('step'),
            change: {
                index: function (newIndex, oldIndex, changes) {
                    me.set('index', newIndex, changes.index);
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

        me.set({
            index: me.option('index'),
            minIndex: me.option('minIndex'),
            maxIndex: me.option('maxIndex')
        });

    };

    proto.prev = function () {
        this.inner('iterator').prev();
    };

    proto.next = function () {
        this.inner('iterator').next();
    };

    proto.play = function () {
        this.inner('iterator').start();
    };

    proto.pause = function () {
        this.inner('iterator').pause();
    };

    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('iterator').dispose();
        me.inner('switcher').dispose();

        me.inner('main').off(
            me.namespace()
        );

    };

    lifeCycle.extend(proto);

    Carousel.defaultOptions = {
        index: 0,
        minIndex: 0,
        step: 1,
        loop: true,
        autoplay: true,
        pauseOnHover: true,
        interval: 5000,
        navTrigger: 'enter',
        navAnimate: function (options) {

            var activeClass = options.navActiveClass;
            if (!activeClass) {
                return;
            }

            var navItems = options.mainElement.find(
                options.navSelector
            );

            if (navItems.length > 1) {
                if (options.fromIndex >= 0) {
                    navItems.eq(options.fromIndex).removeClass(activeClass);
                }
                if (options.toIndex >= 0) {
                    navItems.eq(options.toIndex).addClass(activeClass);
                }
            }

        }
    };

    Carousel.propertyUpdater = {

        index: function (index) {

            var me = this;

            me.inner('switcher').set('index', index);

            var iterator = me.inner('iterator');
            iterator.set('index', index);
console.log('index',index)
            if (me.option('autoplay')) {
                iterator.start();
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

        maxIndex: function (maxIndex) {

            if ($.type(maxIndex) !== 'number') {

                var me = this;
                var itemSelector = me.option('itemSelector');
                var itemElements = me.inner('main').find(itemSelector);

                maxIndex = itemElements.length - 1;

            }

            return maxIndex;

        }

    };


    return Carousel;

});