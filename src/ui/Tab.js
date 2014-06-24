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
     * @property {jQuery} options.element 主元素
     * @property {string} options.navSelector 导航项的选择器，如 .nav-item
     * @property {string} options.contentSelector 内容区的选择器，如 .tab-panel
     * @property {number=} options.activeIndex 当前选中的索引
     * @property {string} options.navActiveClass 导航项选中状态的class
     * @property {string=} options.contentActiveClass 内容区选中状态的 class，如果未设置，直接 show/hide
     * @property {Function=} options.onChange 切换 tab 触发
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
                               .index(element.find('.' + me.navActiveClass));

                if (!$.isNumeric(index)) {
                    return;
                }
            }

            me.activate(index, true);
        },

        /**
         * 激活 tab
         *
         * @param {number} index
         * @param {boolean=} silence 是否不出发 onChange 事件，默认为 false
         */
        activate: function (index, silence) {

            var me = this;
            var element = me.element;

            // 先处理 nav 再处理 content
            // 因为 nav 的数量是稳定的
            // content 的数量可以和 nav 一致，或者只有一个（切换时刷新，而非隐藏显示）

            var navs = element.find(me.navSelector);
            var maxIndex = navs.length - 1;

            if (index < 0 || index > maxIndex) {
                return;
            }

            var oldIndex = me.activeIndex;
            var navActiveClass = me.navActiveClass;

            // 切换 nav
            var validOldIndex = oldIndex >= 0 && oldIndex <= maxIndex;
            if (validOldIndex) {
                navs.eq(oldIndex).removeClass(navActiveClass);
            }

            var navItem = navs.eq(index);
            navItem.addClass(navActiveClass);

            // 切换 content
            var contents = element.find(me.contentSelector);
            var contentItem;

            if (contents.length !== 1) {

                var contentActiveClass = me.contentActiveClass;

                if (validOldIndex) {
                    contentItem = contents.eq(oldIndex);
                    if (contentActiveClass) {
                        contentItem.removeClass(contentActiveClass);
                    }
                    else {
                        contentItem.hide();
                    }
                }

                contentItem = contents.eq(index);

                if (contentActiveClass) {
                    contentItem.addClass(contentActiveClass);
                }
                else {
                    contentItem.show();
                }
            }
            else {
                contentItem = contents.eq(0);
            }

            me.activeIndex = index;

            if (!silence && $.isFunction(me.onChange)) {
                me.onChange({
                    index: index,
                    nav: navItem,
                    content: contentItem
                });
            }
        },

        /**
         * 销毁对象
         */
        dispose: function () {
            me.element.off(namespace);
            me.element = null;
        }

    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Tab.defaultOptions = {
        navActiveClass: 'tab-active'
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
