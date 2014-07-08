/**
 * @file 包含
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * container 是否包含 element
     * @param {HTMLElement} container
     * @param {HTMLElement} element
     * @return {boolean}
     */
    function contains(container, element) {
        if (container === element) {
            return true;
        }
        return $.contains(container, element);
    }

    /**
     * container 是否包含 element
     *
     * 可测试多个容器（container.length > 1）是否包含 element
     *
     * @param {jQuery} container
     * @param {HTMLElement} element
     * @return {boolean}
     */
    return function (container, element) {

        var result = false;

        container.each(
            function () {
                return result = contains(this, element);
            }
        );

        return result;

    };

});