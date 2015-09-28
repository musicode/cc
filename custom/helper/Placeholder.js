define(function (require, exports, module) {

    'use strict';

    var Placeholder = require('cc/helper/Placeholder');

    Placeholder.defaultOptions = {
        nativeFirst: false,
        inputSelector: ':text',
        labelSelector: '.placeholder',
        showAnimation: function (options) {
            options.labelElement.fadeIn(500);
        },
        hideAnimation: function (options) {
            options.labelElement.hide();
        }
    };

    return Placeholder;

});