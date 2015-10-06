define(function (require, exports, module) {

    'use strict';

    var ComboBox = require('cc/ui/ComboBox');

    ComboBox.defaultOptions = {
        itemSelector: 'li',
        textAttribute: 'data-text',
        valueAttribute: 'data-value',

        showMenuTrigger: 'click',
        hideMenuTrigger: 'click',

        showMenuAnimation: function (options) {
            options.menuElement.show();
        },
        hideMenuAnimation: function (options) {
            options.menuElement.hide();
        }
    };

    return ComboBox;

});