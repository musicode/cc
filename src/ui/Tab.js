/**
 * @file Tab
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 标签页
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {string} options.navSelector
     * @property {string} options.contentSelector
     * @property {number=} options.activeIndex
     * @property {string} options.activeClass
     * @property {Function} options.onChange
     * @argument {Object} options.onChange.data
     */
    function Tab(options) {
        $.extend(this, Tab.defaultOptions, options);
        this.init();
    }

    Tab.prototype = {

        constructor: Tab,

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;

            element.on('click' + namespace, me.navSelector, me, clickNav);

            var index = me.activeIndex;

            if (!$.isNumeric(index)) {
                index = element.find(me.navSelector)
                               .index(element.find('.' + me.activeClass));

                if (!$.isNumeric(index)) {
                    return;
                }
            }

            me.activate(index);
        },

        /**
         * 激活 tab
         *
         * @param {number} index
         */
        activate: function (index) {

            var me = this;
            var element = me.element;

            var navs = element.find(me.navSelector);
            if (index < 0 || index >= navs.length) {
                return;
            }

            var contents = element.find(me.contentSelector);
            var navTarget = navs.eq(index);
            var contentTarget;

            var oldIndex = me.activeIndex;
            var activeClass = me.activeClass;

            // 切换 nav
            if (oldIndex >= 0) {
                navs.eq(oldIndex).removeClass(activeClass);
            }
            navTarget.addClass(activeClass);

            // 如果只有一个内容，不需要切换
            if (contents.length !== 1) {
                if (oldIndex >= 0) {
                    contents.eq(oldIndex).hide();
                }
                contentTarget = contents.eq(index);
                contentTarget.show();
            }
            else {
                contentTarget = contents.eq(0);
            }

            this.activeIndex = index;

            if ($.isFunction(me.onChange)) {
                me.onChange({
                    index: index,
                    nav: navTarget,
                    content: contentTarget
                });
            }
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            me.element.off(namespace);

            me.element =
            me.cache = null;
        }

    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Tab.defaultOptions = {
        activeClass: 'tab-active'
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_tab';

    /**
     * 点击导航 tab 时的处理函数
     *
     * @inner
     * @param {Event} e
     */
    function clickNav(e) {

        var tab = e.data;
        var target = $(e.currentTarget);

        var index = tab.element
                       .find(tab.navSelector)
                       .index(target);

        tab.activate(index);

        // 防止 target 是 <a>
        return false;
    }

    return Tab;

});