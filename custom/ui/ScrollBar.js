define(function (require, exports, module) {

    'use strict';

    var ScrollBar = require('cc/ui/ScrollBar');

    ScrollBar.defaultOptions = {
        scrollStep: 5,
        scrollStepType: 'pixel',
        orientation: 'vertical',
        minWidth: 10,
        minHeight: 10,
        mainTemplate: '<i class="scroll-thumb"></i>',
        thumbSelector: '.scroll-thumb',
        showAnimation: function (options) {
            options.mainElement.show();
        },
        hideAnimation: function (options) {
            options.mainElement.hide();
        },
        scrollAnimation: function (options) {
            options.thumbElement.css(
                options.thumbStyle
            );
        }
    };

    return ScrollBar;

});