/**
 * @file 包含
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * container 是否包含 element
     *
     * @param {jQuery|HTMLElement} container
     * @param {jQuery|HTMLElement} element
     * @return {boolean}
     */
    return function (container, element) {

        container = container.jquery
                  ? container[0]
                  : container;

        element = element.jquery
                ? element[0]
                : element;

        if (!container || !element) {
            return false;
        }

        if (container === element) {
            return true;
        }

        return $.contains(container, element);

    };

});