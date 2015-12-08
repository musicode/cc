define(function (require, exports, module) {

    'use strict';

    var Dialog = require('cc/ui/Dialog');

    Dialog.defaultOptions = {

        x: '50%',
        y: '50%',

        modal: true,
        fixed: true,
        hidden: false,
        draggable: true,
        hideOnBlur: false,
        removeOnEmpty: true,
        disposeOnHide: true,
        removeOnDispose: true,
        positionOnResize: true,

        draggableClass: 'draggable',

        draggableIncludeSelector: '.dialog-header',
        draggableExcludeSelector: [ '.dialog-header h1', '.dialog-close' ],

        parentSelector: 'body',

        headerSelector: '.dialog-header',
        titleSelector: '.dialog-header h1',
        closeSelector: '.dialog-close',
        contentSelector: '.dialog-body',

        mainTemplate: '<div class="dialog">'
                    +     '<i class="dialog-close">&times;</i>'
                    +     '<div class="dialog-header"><h1></h1></div>'
                    +     '<div class="dialog-body"></div>'
                    + '</div>',

        maskTemplate: '<div class="dialog-mask"></div>',

        showAnimation: function (options) {
            options.mainElement.show();
            if (options.maskElement) {
                options.maskElement.show();
            }
        },
        hideAnimation: function (options) {
            options.mainElement.hide();
            if (options.maskElement) {
                options.maskElement.hide();
            }
        },
        dragAnimation: function (options) {
            options.mainElement.css(options.mainStyle);
        },
        refreshAnimation: function (options) {
            options.mainElement.css(options.mainStyle);
        },
        resizeWindowAnimation: function (options) {
            options.mainElement.css(options.mainStyle);
            if (options.maskElement) {
                options.maskElement.css(options.maskStyle);
            }
        }

    };

    return Dialog;

});