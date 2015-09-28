define(function (require, exports, module) {

    'use strict';

    var Draggable = require('cc/helper/Draggable');

    Draggable.defaultOptions = {
        bodyDraggingClass: 'no-selection',
        dragAnimation: function (options) {
            options.mainElement.css(options.mainStyle);
        }
    };

    return Draggable;

});