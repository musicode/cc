define(function (require, exports, module) {

    'use strict';

    var Slider = require('cc/ui/Slider');

    Slider.defaultOptions = {
        minValue: 0,
        maxValue: 100,
        scrollStepType: 'value',
        orientation: 'horizontal',
        mainTemplate: '<div class="slider-thumb"></div>',
        slideAnimation: function (options) {
            options.thumbElement.css(options.thumbStyle);
            if (options.barStyle) {
                options.barElement.css(options.barStyle);
            }
        }
    };

    return Slider;

});