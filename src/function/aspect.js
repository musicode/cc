/**
 * @file 拦截方法的前后
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var around = require('./around');

    return function (target, name) {

        var ucFirst = name.charAt(0).toUpperCase()
                    + name.slice(1);

        around(
            target,
            name,
            function () {
                target.emit('before' + ucFirst);
            },
            function () {
                target.emit('after' + ucFirst);
            }
        );

    };

});