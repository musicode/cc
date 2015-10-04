define(function (require, exports, module) {

    'use strict';

    var Zoom = require('cc/ui/Zoom');

    Zoom.defaultOptions = {
        showFinderAnimation: function (options) {
            options.finderElement.show();
        },
        hideFinderAnimation: function (options) {
            options.finderElement.hide();
        },
        showViewportAnimation: function (options) {
            options.viewportElement.show();
        },
        hideViewportAnimation: function (options) {
            options.viewportElement.hide();
        }
    };

    return Zoom;

});