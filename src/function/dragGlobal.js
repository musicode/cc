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
     * @property {string|Array.<string>} options.handleSelector
     * @property {string|Array.<string>} options.cancelSelector
     * @property {string=} options.draggingClass 拖拽时给 element 添加的 class
     * @return {Draggable}
     */
    return function (options) {

        return new Draggable({
            mainElement: options.element,
            containerElement: instance.body,
            mainDraggingClass: options.draggingClass,
            handleSelector: options.handleSelector,
            cancelSelector: options.cancelSelector
        });

    };

});