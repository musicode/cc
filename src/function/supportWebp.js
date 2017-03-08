/**
 * @file 是否支持 webp 格式的图片
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var result;

    /**
     * 是否支持 webp 格式的图片
     *
     * @return {Promise}
     */
    return function () {

        if (result) {
            return result;
        }

        var promise = $.Deferred();

        var image = new Image();

        image.onload =
        image.onerror = function () {
            if (image.height === 2) {
                promise.resolve();
            }
            else {
                promise.reject();
            }
        };

        image.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';

        result = promise;

        return promise;

    };

});