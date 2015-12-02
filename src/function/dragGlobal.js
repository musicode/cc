/**
 * @file 全局拖拽
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var Draggable = require('../helper/Draggable');

    var instance = require('../util/instance');

    /**
     * @param {Object} options
     * @property {string} options.element 要定位的元素
     * @property {string|Array.<string>} options.includeSelector
     * @property {string|Array.<string>} options.excludeSelector
     * @property {string=} options.draggingClass 拖拽时给 element 添加的 class
     * @return {Draggable}
     */
    return function (options) {

        return new Draggable({
            mainElement: options.element,
            containerElement: instance.body,
            mainDraggingClass: options.draggingClass,
            includeSelector: options.includeSelector,
            excludeSelector: options.excludeSelector,
            dragAnimation: options.dragAnimation,
            init: function (options) {

                var namespace = options.namespace;

                options.mainElement
                    .on('mousedown' + namespace, function (e) {

                        if (!options.downHandler(e)) {
                            return;
                        }

                        instance.document
                            .off(namespace)
                            .on('mousemove' + namespace, options.moveHandler)
                            .on('mouseup' + namespace, function (e) {

                                options.upHandler(e);

                                instance.document.off(namespace);

                            });

                    });
            }
        });

    };

});