/**
 * @file 图片懒加载
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var viewportHeight = require('../function/viewportHeight');
    var pageScrollTop = require('../function/pageScrollTop');
    var debounce = require('../function/debounce');
    var guid = require('../function/guid');

    var windowInstance = require('./instance').window;

    /**
     * 阈值
     *
     * @type {number}
     */
    exports.threshold = 20;

    /**
     * 获取图片地址，data 来自图片元素上的 data-* 数据集合
     *
     * @param {Object} data
     * @return {string}
     */
    exports.getImageUrl = function (data) {
        // 实现取决于图片服务提供商
        return '';
    };

    exports.load = function (container, selector) {

        var images = container.find(selector || 'img');
        var namespace = '.' + guid();

        var loadImage = function () {
            var loadComplete = true;
            var scrollBottom = pageScrollTop() + viewportHeight();

            images.each(function () {
                var element = $(this);
                if (!element.prop('src')) {
                    var imageTop = element.offset().top;
                    if (imageTop - exports.threshold < scrollBottom) {
                        var url = exports.getImageUrl(element.data());
                        if (url) {
                            element.prop('src', url);
                            return;
                        }
                        else {
                            throw new Error('[lazyLoader] getImageUrl must return a string.');
                        }
                    }
                    if (loadComplete) {
                        loadComplete = false;
                    }
                }
            });

            return loadComplete;
        };

        if (!loadImage()) {
            windowInstance.on(
                'scroll' + namespace,
                debounce(
                    function () {
                        if (loadImage()) {
                            windowInstance.off(namespace);
                        }
                    },
                    100
                )
            );
        }

    };

});