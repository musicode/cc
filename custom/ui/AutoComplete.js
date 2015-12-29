define(function (require, exports, module) {

    'use strict';

    var AutoComplete = require('cc/ui/AutoComplete');

    AutoComplete.defaultOptions = {
        loop: true,
        interval: 60,
        includeInput: true,
        itemSelector: '.item',
        valueAttribute: 'data-value',
        showMenuTrigger: 'focus',
        hideMenuTrigger: 'click',
        showMenuAnimation: function (options) {
            options.menuElement.show();
        },
        hideMenuAnimation: function (options) {
            options.menuElement.hide();
        }
    };

    return AutoComplete;

});