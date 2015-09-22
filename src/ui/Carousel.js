/**
 * @file 轮播
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 90%
     */

    var lifeCycle = require('../function/lifeCycle');
    var Switchable = require('../helper/Switchable');


    /**
     * 轮播
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     *
     * @property {number=} options.index 从第几个开始播放，默认是 0
     * @property {number=} options.step 每次滚动几个，默认是 1
     * @property {number=} options.showCount 显示个数，默认是 1
     *
     * @property {number=} options.interval 自动播放时，切换的时间间隔，默认 5000
     * @property {boolean=} options.autoPlay 是否自动播放，默认 true
     * @property {boolean=} options.loop 是否循环播放，默认为 true
     * @property {boolean=} options.pauseOnHover 是否鼠标 hover 时暂停播放，默认为 true
     *
     * @property {string=} options.navTrigger 当有图标按钮时，触发改变的方式，可选值有 over click， 默认是 over
     * @property {string=} options.navActiveClass 转场时会为 icon 切换这个 class
     * @property {string=} options.navSelector 图标按钮选择器（一般会写序号的小按钮）
     *
     * @property {string=} options.prevSelector 上一页的选择器
     * @property {string=} options.nextSelector 下一页的选择器
     * @property {string} options.itemSelector 幻灯片选择器
     *
     * @property {Function} options.navAnimate
     * @property {Function} options.contentAnimate 切换动画，必传，否则不会动
     *
     */
    function Carousel(options) {
        lifeCycle.init(this, options);
    }

    var proto = Carousel.prototype;


    proto.type = 'Carousel';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');

        var namespace = me.namespace();
        var clickType = 'click' + namespace;

        var prevSelector = me.option('prevSelector');
        if (prevSelector) {
            mainElement
                .on(clickType, prevSelector, $.proxy(me.prev, me));
        }

        var nextSelector = me.option('nextSelector');
        if (nextSelector) {
            mainElement
                .on(clickType, nextSelector, $.proxy(me.next, me));
        }

        var autoPlay = me.option('autoPlay');
        var itemSelector = me.option('itemSelector');
        if (autoPlay && me.option('pauseOnHover')) {
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

        me.set({
            minIndex: 0,
            maxIndex: mainElement.find(itemSelector).length - 1
                    - (me.option('showCount') - 1)
        });

        var navSelector = me.option('navSelector');
        var navActiveClass = me.option('navActiveClass');

        var switcher = new Switchable({
            element: mainElement,
            index: me.option('index'),
            trigger: me.option('navTrigger'),
            selector: navSelector,
            activeClass: navActiveClass,
            change: {
                index: function (toIndex, fromIndex) {

                    me.execute('navAnimate', {
                        mainElement: mainElement,
                        navSelector: navSelector,
                        navActiveClass: navActiveClass,
                        fromIndex: fromIndex,
                        toIndex: toIndex
                    });

                    me.execute('contentAnimate', {
                        mainElement: mainElement,
                        contentSelector: me.option('contentSelector'),
                        contentActiveClass: me.option('contentActiveClass'),
                        fromIndex: fromIndex,
                        toIndex: toIndex
                    });

                    me.set('index', toIndex);

                }
            }
        });

        me.inner({
            main: mainElement,
            switcher: switcher
        });

    };

    /**
     * 上一个
     */
    proto.prev = function () {

        var me = this;

        var index = me.get('index') - me.option('step');
        if (index < me.get('minIndex')) {
            if (me.option('loop')) {
                index = me.get('maxIndex');
            }
            else {
                return;
            }
        }

        me.set('index', index);

    };

    /**
     * 下一个
     */
    proto.next = function () {

        var me = this;

        var index = me.get('index') + me.option('step');
        if (index > me.get('maxIndex')) {
            if (me.option('loop')) {
                index = me.get('minIndex');
            }
            else {
                return;
            }
        }

        me.set('index', index);

    };

    /**
     * 开始自动播放
     */
    proto.play = function () {
        this.set('playing', true);
    };

    /**
     * 暂停自动播放
     */
    proto.pause = function () {
        this.set('playing', false);
    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        if (me.get('playing')) {
            me.pause();
        }

        me.inner('main').off(
            me.namespace()
        );
        me.inner('switcher').dispose();

    };

    lifeCycle.extend(proto);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Carousel.defaultOptions = {
        index: 0,
        step: 1,
        interval: 5000,
        showCount: 1,
        loop: true,
        autoPlay: true,
        pauseOnHover: true,
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

            if (me.get('playing')) {
                startPlayTimer(me);
            }

        },

        playing: function (playing) {

            var me = this;

            clearPlayTimer(me);

            if (playing) {
                startPlayTimer(me);
            }

        }

    };

    Carousel.propertyValidator = {

        playing: function (playing) {

            var me = this;

            if ($.type(playing) !== 'boolean') {
                playing = false;
            }

            if (playing && !me.option('autoPlay')) {
                playing = false;
            }

            return playing;

        }

    };

    /**
     * 开始自动播放的 timer
     *
     * @inner
     * @param {Carousel} instance
     */
    function startPlayTimer(instance) {

        clearPlayTimer(instance);

        instance.inner(
            'playTimer',
            setTimeout(
                $.proxy(instance.next, instance),
                instance.option('interval')
            )
        );

    }

    /**
     * 清除自动播放的 timer
     *
     * @inner
     * @param {Carousel} instance
     */
    function clearPlayTimer(instance) {

        var playTimer = instance.inner('playTimer');

        if (playTimer) {
            clearTimeout(playTimer);
            instance.inner('playTimer', null);
        }

    }


    return Carousel;

});