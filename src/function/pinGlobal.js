/**
 * @file 全局定位
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var pin = require('./pin');

    var dimension = require('../util/dimension');
    var viewport = require('../function/viewport');

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

            silence: true,

            element: options.element,

            x: options.x === '50%' ? '50%' : 0,
            y: options.y === '50%' ? '50%' : 0,

            attachment: {
                element: viewport(),
                width: dimension.getViewportWidth(),
                height: dimension.getViewportHeight(),
                x: options.x,
                y: options.y
            }
        };

        if (!options.fixed) {
            pinOptions.offset = {
                x: dimension.getPageScrollLeft(),
                y: dimension.getPageScrollTop()
            };
        }

        return pin(pinOptions);

    };

});