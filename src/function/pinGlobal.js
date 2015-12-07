/**
 * @file 全局定位
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var pin = require('./pin');

    var viewport = require('./viewport');
    var viewportWidth = require('./viewportWidth');
    var viewportHeight = require('./viewportHeight');
    var pageScrollLeft = require('./pageScrollLeft');
    var pageScrollTop = require('./pageScrollTop');

    /**
     * @param {Object} options
     * @property {string} options.element 要定位的元素
     * @property {number|string} options.x 可以是像素值，或是百分比
     * @property {number|string} options.y 可以是像素值，或是百分比
     * @property {boolean} options.fixed 是否为 fixed 定位
     * @return {Object} 返回坐标
     */
    return function (options) {

        var pinOptions = {

            silent: true,

            element: options.element,

            x: options.x === '50%' ? '50%' : 0,
            y: options.y === '50%' ? '50%' : 0,

            attachment: {
                element: viewport(),
                width: viewportWidth(),
                height: viewportHeight(),
                x: options.x,
                y: options.y
            }
        };

        if (!options.fixed) {
            pinOptions.offset = {
                x: pageScrollLeft(),
                y: pageScrollTop()
            };
        }

        return pin(pinOptions);

    };

});