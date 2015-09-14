/**
 * @file setValue，统一判断 options
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    return function (target, name, newValue, options, creator) {

        options = options || { };

        var oldValue = target[ name ];

        if (options.force || newValue !== oldValue) {

            target[ name ] = newValue;

            if (!options.silence) {

                var data;

                if ($.type(creator) === 'function') {
                    data = creator(newValue, oldValue, options);
                }

                target.emit('change', data);

            }
        }
    };

});