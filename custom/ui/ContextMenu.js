define(function (require, exports, module) {

    'use strict';

    var ContextMenu = require('cc/ui/ContextMenu');

    ContextMenu.defaultOptions = {
        parentSelector: 'body',
        showAnimation: function (options) {
            options.mainElement.show();
        },
        hideAnimation: function (options) {
            options.mainElement.hide();
        }
    };

    return ContextMenu;

});