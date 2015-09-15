/**
 * @file 拦截方法的前后
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var around = require('./around');

    return function (target, name, validate) {

        var ucFirst = name.charAt(0).toUpperCase()
                    + name.slice(1);

        around(
            target,
            name,
            function () {

                if ($.type(validate) === 'function'
                    && validate.call(this) === false
                ) {
                    return false;
                }

                var event = this.emit('before' + ucFirst);

                if (event.isDefaultPrevented()) {
                    return false;
                }

            },
            function () {
                this.emit('after' + ucFirst);
            }
        );

    };

});