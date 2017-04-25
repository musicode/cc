/**
 * @file 简单模板渲染函数
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 简单模板渲染函数
     *
     * @param {string} tpl
     * @param {Object} data
     * @return {string}
     */
    return function (tpl, data) {

        $.each(
            data,
            function (key, value) {
                tpl = tpl.replace(
                    new RegExp('\\$\\{' + key + '\\}', 'g'),
                    function () {
                        return value;
                    }
                );
            }
        );

        return tpl;

    };

});