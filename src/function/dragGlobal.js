/**
 * @file 全局拖拽
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var Draggable = require('../helper/Draggable');

    var instance = require('../util/instance');
    var dimension = require('../util/dimension');

    var pin = require('./pin');

    /**
     * @param {Object} options
     * @property {string} options.element 要定位的元素
     * @property {string|Array.<string>} options.handleSelector
     * @property {string|Array.<string>} options.cancelSelector
     * @property {string=} options.draggingClass 拖拽时给 element 添加的 class
     * @property {boolean=} options.fixed 是否为 fixed 定位
     * @property {boolean=} options.scrollable 是否可以滚动拖拽
     * @return {Draggable}
     */
    return function (options) {

        return new Draggable({
            element: options.element,
            container: instance.body,
            draggingClass: options.draggingClass,
            handleSelector: options.handleSelector,
            cancelSelector: options.cancelSelector,
            rect: function () {

                var fixed = options.fixed;
                var scrollable = options.scrollable;

                return {
                    x: (fixed || scrollable) ? 0 : dimension.getPageScrollLeft(),
                    y: (fixed || scrollable) ? 0 : dimension.getPageScrollTop(),
                    width: (fixed || !scrollable) ? dimension.getViewportWidth() : dimension.getPageWidth(),
                    height: (fixed || !scrollable) ? dimension.getViewportHeight() : dimension.getPageHeight()
                };
            }
        });

    };

});