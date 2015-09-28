define(function (require, exports, module) {

    'use strict';

    var Popup = require('cc/helper/Popup');

    Popup.defaultOptions = {
        showLayerTrigger: 'click',
        hideLayerTrigger: 'click',
        showLayerAnimation: function (options) {
            options.layerElement.show();
        },
        hideLayerAnimation: function (options) {
            options.layerElement.hide();
        }
    };

    return Popup;

});