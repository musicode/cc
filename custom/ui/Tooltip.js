define(function (require, exports, module) {

    'use strict';

    var Tooltip = require('cc/ui/Tooltip');

    Tooltip.defaultOptions = {
        showTrigger: 'enter',
        showDelay: 100,
        showAnimation: function (options) {
            options.mainElement.show();
        },

        hideTrigger: 'leave,click',
        hideDelay: 100,
        hideAnimation: function (options) {
            options.mainElement.hide();
        },

        mainTemplate: '<div class="tooltip secondary"></div>',
        triggerSelector: '[data-title]',

        share: true,
        underBody: true,
        placement: 'bottom,auto',

        skinAttribute: 'data-skin',
        placementAttribute: 'data-placement',
        maxWidthAttribute: 'data-width',

        topClass: 'top',
        rightClass: 'right',
        bottomClass: 'bottom',
        leftClass: 'left',

        gapX: 10,
        gapY: 10,

        update: function (options) {

            options.mainElement.html(
                options.triggerElement.attr('data-title')
            );

        }
    };

    return Tooltip;

});