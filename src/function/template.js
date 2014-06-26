/**
 * @file 渲染模板
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 渲染模版
     *
     * @param {string} tpl
     * @param {Object} data
     * @return {string}
     */
    return function (tpl, data) {
        return tpl.replace(
                    /\${(\w+)}/g,
                    function ($0, $1) {
                        return data[$1] != null ? data[$1] : '';
                    }
                );
    };

});