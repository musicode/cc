define(function (require, exports, module) {

    'use strict';

    var AutoComplete = require('cc/ui/AutoComplete');

    AutoComplete.defaultOptions = {
        interval: 60,
        includeInput: true,
        itemSelector: 'li',
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