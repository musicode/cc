/**
 * @file 包含
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * container 是否包含 element
     *
     * @param {HTMLElement} container
     * @param {HTMLElement} element
     * @return {boolean}
     */
    return function (container, element) {
        if (container === element) {
            return true;
        }
        return $.contains(container, element);
    }

});