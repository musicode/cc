/**
 * @file 设置 attribute
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    return function (element, name, value) {

        if (!element) {
            return;
        }

        if (value) {

            if ($.type(value) === 'boolean') {
                value = name;
            }

            element.attr(name, value);

        }
        else {
            element.removeAttr(name);
        }

    };

});