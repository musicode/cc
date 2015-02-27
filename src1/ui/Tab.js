/**
 * @file Tab
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 90%
     */

    var jquerify = require('../function/jquerify');
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
     * @property {number} options.animation.data.from
     * @property {number} options.animation.data.to
     *
     * @property {Function=} options.onChange 切换 tab 触发
     * @argument {Event} options.onChange.event 事件对象
     * @argument {Object} options.onChange.data
     * @property {number} options.onChange.data.from
     * @property {number} options.onChange.data.to
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

                    var from = data.from;
                    var to = data.to;

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
                                contents.eq(from).removeClass(activeClass);
                                contents.eq(to).addClass(activeClass);
                            }
                            else {
                                contents.eq(from).hide();
                                contents.eq(to).show();
                            }
                        }
                    }

                    me.index = to;

                    if (from !== to) {
                        me.emit('change', data);
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

    jquerify(Tab.prototype);

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
