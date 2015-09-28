define(function (require, exports, module) {

    'use strict';

    var Tab = require('cc/ui/Tab');

    Tab.defaultOptions = {
        navTrigger: 'click',
        navDelay: 100,
        navActiveClass: 'active',
        navSelector: '.nav-item',
        contentSelector: '.tab-panel',
        navAnimation: function (options) {

            var activeClass = options.navActiveClass;
            if (!activeClass) {
                return;
            }

            var navItems = options.mainElement.find(
                options.navSelector
            );

            if (navItems.length > 1) {

                navItems.filter('.' + activeClass).removeClass(activeClass);

                if (options.toIndex >= 0) {
                    navItems.eq(options.toIndex).addClass(activeClass);
                }

            }

        },
        contentAnimation: function (options) {

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

    return Tab;

});