/**
 * @file setValue，统一判断 options
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    return function (newValue, options, getValue, setValue, update) {

        options = options || { };

        var oldValue = getValue();

        if (options.force || newValue !== oldValue) {

            setValue(newValue);

            var data;

            if ($.isFunction(update)) {
                data = update(newValue, oldValue, options);
            }

            if (!options.silence) {

                var data = {
                    prop: '',
                    newValue: newValue,
                    oldValue: oldValue
                };

                target.emit('change', data);

            }

            return true;

        }
    };

});