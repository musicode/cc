define(function (require, exports, module) {

    'use strict';

    var Text = require('cc/form/Text');

    Text.defaultOptions = {
        nativeFirst: true,
        inputSelector: 'input[type="text"]',
        labelSelector: '.placeholder',
        showAnimation: function (options) {
            options.labelElement.fadeIn(500);
        },
        hideAnimation: function (options) {
            options.labelElement.hide();
        }
    };

    return Text;

});