/**
 * @file Tab
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var lifeCycle = require('../util/lifeCycle');
    var Switchable = require('../helper/Switchable');

    /**
     * 标签页
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {number=} options.index 当前选中的索引，如果未传此项，会通过 navActiveClass 算出索引
     *
     * @property {string=} options.navTrigger 触发方式，可选值包括 over click，默认是 click
     * @property {number=} options.navDelay 触发延时
     *
     * @property {string} options.navSelector 导航项的选择器，如 .nav-item
     * @property {string=} options.contentSelector 内容区的选择器，如 .tab-panel
     *
     * @property {string} options.navActiveClass 导航项选中状态的 className
     * @property {string=} options.contentActiveClass 内容区选中状态的 className
     *
     * @property {Function=} options.navAnimate 切换动画
     * @property {Function=} options.contentAnimate 切换动画
     */
    function Tab(options) {
        lifeCycle.init(this, options);
    }

    var proto = Tab.prototype;

    proto.type = 'Tab';

    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');

        var navSelector = me.option('navSelector');
        var navActiveClass = me.option('navActiveClass');

        var switcher = new Switchable({
            mainElement: mainElement,
            index: me.option('index'),
            switchTrigger: me.option('navTrigger'),
            switchDelay: me.option('navDelay'),
            itemSelector: navSelector,
            itemActiveClass: navActiveClass,
            propertyChange: {
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

    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('switcher').dispose();

    };

    lifeCycle.extend(proto);

    Tab.defaultOptions = {
        navTrigger: 'click',
        navActiveClass: 'active',
        navSelector: '.nav-item',
        contentSelector: '.tab-panel',
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

        },
        contentAnimate: function (options) {

            var contentItems = options.mainElement.find(
                options.contentSelector
            );

            // 单个 content 表示不需要切换，每次都是刷新这块内容区
            if (contentItems.length > 1) {

                var activeClass = options.contentActiveClass;

                if (activeClass) {
                    contentItems.eq(options.fromIndex).removeClass(activeClass);
                    contentItems.eq(options.toIndex).addClass(activeClass);
                }
                else {
                    contentItems.eq(options.fromIndex).hide();
                    contentItems.eq(options.toIndex).show();
                }

            }

        }
    };

    Tab.propertyUpdater = {
        index: function (to) {
            this.inner('switcher').set('index', to);
        }
    };


    return Tab;

});
