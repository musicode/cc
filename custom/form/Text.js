define(function (require, exports, module) {

    'use strict';

    var Text = require('cc/form/Text');

    Text.defaultOptions = {
        nativeFirst: true,
        inputSelector: 'input[type="text"],textarea',
        labelSelector: '.placeholder',
        showPlaceholderAnimation: function (options) {
            options.labelElement.fadeIn(500);
        },
        hidePlaceholderAnimation: function (options) {
            options.labelElement.hide();
        }
    };

    return Text;

});