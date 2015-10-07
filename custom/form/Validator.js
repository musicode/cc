define(function (require, exports, module) {

    'use strict';

    var Validator = require('cc/form/Validator');

    Validator.defaultOptions = {
        validateOnBlur: false,
        scrollOffset: -100,
        groupSelector: '.form-group',
        fieldSelector: '[name]',
        successClass: 'has-success',
        errorClass: 'has-error',
        errorSelector: '.error',
        render: function (data, tpl) {
            return tpl.replace(/\${(\w+)}/g, function ($0, $1) {
                return data[$1] || '';
            });
        }
    };

    return Validator;

});