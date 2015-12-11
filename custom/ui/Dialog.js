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

        removeOnEmpty: false,
        disposeOnHide: true,
        removeOnDispose: true,
        positionOnResize: true,

        hideOnClickMask: false,

        draggableClass: 'draggable',

        draggableIncludeSelector: '> .header',
        draggableExcludeSelector: [ '> .header > .title', '> .close' ],

        parentSelector: 'body',

        headerSelector: '> .header',
        titleSelector: '> .header > .title',
        closeSelector: '> .close',
        contentSelector: '> .body',
        footerSelector: '> .footer',

        mainTemplate: '<div class="dialog">'
                   +     '<div class="header">'
                   +         '<div class="title"></div>'
                   +     '</div>'
                   +     '<span class="close">&times;</span>'
                   +     '<div class="body"></div>'
                   +     '<div class="footer"></div>'
                   + '</div>',

        maskTemplate: '<div class="mask"></div>',

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
            var maskElement = options.maskElement;
            if (maskElement) {
                maskElement.css(options.maskStyle);
            }
        },
        resizeWindowAnimation: function (options) {
            options.mainElement.css(options.mainStyle);
            var maskElement = options.maskElement;
            if (maskElement) {
                maskElement.css(options.maskStyle);
            }
        }

    };

    return Dialog;

});