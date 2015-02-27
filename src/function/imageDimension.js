/**
 * @file 获取图片大小
 * @author zhujl
 */
 define(function (require, exports, module) {

    'use strict';

    /**
     * 缓存图片引用，避免因为清除引用导致图片不触发 load 事件
     *
     * @inner
     * @type {Array}
     */
    var imageList = [ ];

    /**
     * 获得图片的宽高
     *
     * @inner
     * @param {string} url 图片地址
     * @param {Function} callback 图片加载后的回调
     */
    return function (url, callback) {

        // IE8 获取图片高度有问题，所以换种方式

        var img = new Image();
        var index = imageList.push(img);

        img.onload = function () {

            var height = img.height;

            if (height != null && height > 0) {
                callback(img.width, height);
                delete imageList[index - 1];
                img = null;
            }
            else {
                setTimeout(img.onload, 10);
            }
        };

        img.src = url;

    };

});