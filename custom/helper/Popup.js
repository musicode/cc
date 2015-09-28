define(function (require, exports, module) {

    'use strict';

    var Popup = require('cc/helper/Popup');

    Popup.defaultOptions = {
        // 可以不传 triggerElement，为了少写 if，这里给个默认值
        triggerElement: $({}),
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