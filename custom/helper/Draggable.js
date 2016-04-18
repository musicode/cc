define(function (require, exports, module) {

    'use strict';

    var Draggable = require('cc/helper/Draggable');
    var document = require('cc/util/instance').document;

    Draggable.defaultOptions = {
        dragAnimation: function (options) {
            options.mainElement.css(options.mainStyle);
        },
        init: function (options) {

            var namespace = options.namespace;

            options.mainElement.on(
                'mousedown' + namespace,
                options.mainSelector,
                function (e) {
                    options.downHandler(e);
                    document
                        .off(namespace)
                        .on('mousemove' + namespace, options.moveHandler)
                        .on('mouseup' + namespace, function (e) {
                            options.upHandler(e);
                            document.off(namespace);
                        });
                }
            );

        }
    };

    return Draggable;

});