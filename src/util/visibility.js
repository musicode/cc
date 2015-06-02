/**
 * @file 封装 visibility api
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 厂商前缀
     *
     * @inner
     * @type {string}
     */
    var prefix;

    /**
     * 把 prefix + name 变为驼峰形式
     *
     * @inner
     * @param {string} prefix
     * @param {string} name
     * @return {string}
     */
    function camelize(prefix, name) {

        if (!prefix) {
            return name;
        }

        return prefix + name.slice(0, 1).toUpperCase() + name.slice(1);

    }

    $.each(
        [ 'webkit', 'moz', 'ms', 'o', '' ],
        function (index, item) {
            if (camelize(item, 'hidden') in document) {
                prefix = item;
                return false;
            }
        }
    );

    /**
     * 是否支持
     *
     * @inner
     * @type {boolean}
     */
    var support = prefix != null;

    exports.support = support;

    exports.hidden = function () {
        return document[camelize(prefix, 'hidden')];
    };

    exports.state = function () {
        return document[camelize(prefix, 'visibilityState')];
    };

    exports.change = function (fn) {
        document.addEventListener(
            prefix + 'visibilitychange',
            fn
        );
    };

});
