/**
 * @file Object.keys
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    return function (obj) {

        if (Object.keys) {
            return Object.keys(obj);
        }

        var result = [];
        $.each(obj, function (key) {
           result.push(key);
        });

        return result;

    };

});