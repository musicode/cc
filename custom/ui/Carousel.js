define(function (require, exports, module) {

    'use strict';

    var Carousel = require('cc/ui/Carousel');

    Carousel.defaultOptions = {
        index: 0,
        minIndex: 0,
        step: 1,
        loop: true,
        autoPlay: true,
        pauseOnHover: true,
        interval: 5000,
        navTrigger: 'enter',
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

        }
    };

    return Carousel;

});