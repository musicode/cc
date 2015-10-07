define(function (require, exports, module) {

    'use strict';

    var Validator = require('cc/form/Validator');
    var etpl = require('cc/util/etpl');

    var render;

    Validator.defaultOptions = {
        validateOnBlur: false,
        scrollOffset: -100,
        groupSelector: '.form-group',
        fieldSelector: '[name]',
        successClass: 'has-success',
        errorClass: 'has-error',
        errorSelector: '.error',
        render: function (data, tpl) {
            if (!render) {
                render = etpl.compile(tpl);
            }
            return render(data);
        }
    };

    return Validator;

});