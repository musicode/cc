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
     * 获取图片地址
     *
     * @param {Object} data
     * @property {string} data.src
     * @property {number} data.width
     * @property {number} data.height
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
                        var data = element.data();
                        var url1x = exports.getImageUrl({
                            src: data.src,
                            width: data.width,
                            height: data.height
                        });
                        var url2x = exports.getImageUrl({
                            src: data.src,
                            width: data.width * 2,
                            height: data.height * 2
                        });
                        var props = {
                            src: url1x
                        };
                        if (url2x !== url1x) {
                            props.srcset = url2x + ' 2x';
                        }
                        element.prop(props);
                        return;
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