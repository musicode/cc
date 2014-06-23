/**
 * @file position
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var pin = require('../function/pin');

    /**
     * 拷贝对象
     *
     * @inner
     * @param {Object} options
     * @return {Object}
     */
    function copy(options) {
        return $.extend({ }, options);
    }


    exports.pin = pin;

    /**
     * 把元素定位到参照元素的左上方
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery=} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.topLeft = function (options) {
        options = copy(options);
        options.x = 'right';
        options.y = 'bottom';
        options.attachmentX = 'left';
        options.attachmentY = 'top';
        pin(options);
    };

    /**
     * 把元素定位到参照元素的正上方
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery=} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.topCenter = function (options) {
        options = copy(options);
        options.x = 'center';
        options.y = 'bottom';
        options.attachmentX = 'center';
        options.attachmentY = 'top';
        pin(options);
    };

    /**
     * 把元素定位到参照元素的右上方
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery=} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.topRight = function (options) {
        options = copy(options);
        options.x = 'left';
        options.y = 'bottom';
        options.attachmentX = 'right';
        options.attachmentY = 'top';
        pin(options);
    };

    /**
     * 把元素定位到参照元素的正左方
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery=} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.middleLeft = function (options) {
        options = copy(options);
        options.x = 'right';
        options.y = 'middle';
        options.attachmentX = 'left';
        options.attachmentY = 'middle';
        pin(options);
    };

    /**
     * 把元素定位到参照元素的正中心
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery=} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.middleCenter = function (options) {
        options = copy(options);
        options.x = 'center';
        options.y = 'middle';
        options.attachmentX = 'center';
        options.attachmentY = 'middle';
        pin(options);
    };

    /**
     * 把元素定位到参照元素的正右方
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery=} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.middleRight = function (options) {
        options = copy(options);
        options.x = 'left';
        options.y = 'middle';
        options.attachmentX = 'right';
        options.attachmentY = 'middle';
        pin(options);
    };

    /**
     * 把元素定位到参照元素的左下方
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery=} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.bottomLeft = function (options) {
        options = copy(options);
        options.x = 'right';
        options.y = 'top';
        options.attachmentX = 'left';
        options.attachmentY = 'bottom';
        pin(options);
    };

    /**
     * 把元素定位到参照元素的正下方
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery=} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.bottomCenter = function (options) {
        options = copy(options);
        options.x = 'center';
        options.y = 'top';
        options.attachmentX = 'center';
        options.attachmentY = 'bottom';
        pin(options);
    };

    /**
     * 把元素定位到参照元素的右下方
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery=} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.bottomRight = function (options) {
        options = copy(options);
        options.x = 'left';
        options.y = 'top';
        options.attachmentX = 'right';
        options.attachmentY = 'bottom';
        pin(options);
    };

});
