/**
 * @file 格式化文件对象，避免扩展名大小写问题
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 格式化文件对象
     *
     * @param {Object} file
     * @property {string} file.name 文件名称
     * @property {number} file.size 文件大小
     * @return {Object}
     */
    return function (file) {

        var name = file.name;
        var parts = name.split('.');
        var type = parts.length > 1
                 ? parts.pop().toLowerCase()
                 : '';

        return {
            name: name,
            type: type,
            size: file.size
        };

    };

});