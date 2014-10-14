/**
 * @file Tab
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var lifeCycle = require('../function/lifeCycle');
    var Switchable = require('../helper/Switchable');

    /**
     * 标签页
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 主元素
     * @property {number=} options.index 当前选中的索引，如果未传此项，会通过 navActiveClass 算出索引
     *
     * @property {string=} options.trigger 触发方式，可选值包括 over click，默认是 click
     *
     * @property {string} options.navSelector 导航项的选择器，如 .nav-item
     * @property {string=} options.contentSelector 内容区的选择器，如 .tab-panel
     *
     * @property {string} options.navActiveClass 导航项选中状态的 class
     * @property {string=} options.contentActiveClass 内容区选中状态的 class，如果未设置，直接 show/hide
     *
     * @property {Function=} options.animation 切换内容的动画，如果 contentActiveClass 不能满足需求，可自行实现
     * @argument {Object} options.animation.data
     * @property {number} options.animation.data.fromIndex
     * @property {number} options.animation.data.toIndex
     *
     * @property {Function=} options.onChange 切换 tab 触发
     * @argument {Object} options.onChange.data
     * @property {number} options.onChange.data.fromIndex
     * @property {number} options.onChange.data.toIndex
     */
    function Tab(options) {
        return lifeCycle.init(this, options);
    }

    Tab.prototype = {

        constructor: Tab,

        type: 'Tab',

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;

            me.switcher = new Switchable({
                element: element,
                index: me.index,
                trigger: me.trigger,
                selector: me.navSelector,
                activeClass: me.navActiveClass,
                change: function (data) {

                    var fromIndex = data.fromIndex;
                    var toIndex = data.toIndex;

                    // 切换 content，优先使用动画
                    if ($.isFunction(me.animation)) {
                        me.animation(data);
                    }
                    else {

                        var contents = element.find(me.contentSelector);

                        // 单个 content 表示不需要切换，每次都是刷新这块内容区
                        if (contents.length !== 1) {

                            var activeClass = me.contentActiveClass;

                            if (activeClass) {
                                contents.eq(fromIndex).removeClass(activeClass);
                                contents.eq(toIndex).addClass(activeClass);
                            }
                            else {
                                contents.eq(fromIndex).hide();
                                contents.eq(toIndex).show();
                            }
                        }
                    }

                    me.index = toIndex;

                    if (fromIndex !== toIndex && $.isFunction(me.onChange)) {
                        me.onChange(data);
                    }

                }
            });

        },

        /**
         * 激活 tab
         *
         * @param {number} index
         */
        to: function (index) {
            this.switcher.to(index);
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.switcher.dispose();

            me.element =
            me.switcher = null;

        }

    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Tab.defaultOptions = {
        trigger: 'click',
        navActiveClass: 'active',
        navSelector: '.nav-item',
        contentSelector: '.tab-panel'
    };


    return Tab;

});
