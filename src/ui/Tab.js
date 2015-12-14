/**
 * @file Tab
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var lifeUtil = require('../util/life');
    var Switchable = require('../helper/Switchable');

    /**
     *
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {number=} options.index 当前选中的索引，如果未传此项，会通过 navActiveClass 自动计算
     *
     * @property {string} options.navTrigger 切换的触发方式，可选值有 enter、click
     * @property {number=} options.navDelay 切换的触发延时，当 navTrigger 是 enter 时可用
     * @property {Function} options.navAnimation 切换的动画
     *
     * @property {string} options.navSelector 导航项的选择器
     * @property {string=} options.navActiveClass 导航项选中状态的 className
     *
     * @property {string=} options.contentSelector 内容项的选择器
     * @property {string=} options.contentActiveClass 内容项选中状态的 className
     * @property {Function} options.contentAnimation 切换的动画
     *
     */
    function Tab(options) {
        lifeUtil.init(this, options);
    }

    var proto = Tab.prototype;

    proto.type = 'Tab';

    proto.init = function () {

        var me = this;

        me.initStruct();

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
            watchSync: {
                index: function (toIndex, fromIndex) {

                    me.set('index', toIndex);

                    me.execute('navAnimation', {
                        mainElement: mainElement,
                        navSelector: navSelector,
                        navActiveClass: navActiveClass,
                        fromIndex: fromIndex,
                        toIndex: toIndex
                    });

                    me.execute('contentAnimation', {
                        mainElement: mainElement,
                        contentSelector: me.option('contentSelector'),
                        contentActiveClass: me.option('contentActiveClass'),
                        fromIndex: fromIndex,
                        toIndex: toIndex
                    });

                }
            }
        });

        me.inner({
            main: mainElement,
            switcher: switcher
        });

    };

    proto.dispose = function () {

        lifeUtil.dispose(this);

        this.inner('switcher').dispose();

    };

    lifeUtil.extend(proto);

    Tab.propertyUpdater = {

        index: function (toIndex) {
            this.inner('switcher').set('index', toIndex);
        }

    };


    return Tab;

});
