define(function (require, exports, module) {

    'use strict';

    var Validator = require('cc/form/Validator');
    var etpl = require('cc/util/etpl');

    var tplRender = { };

    Validator.defaultOptions = {
        validateOnBlur: false,
        scrollOffset: -100,
        groupSelector: '.form-group',
        errorAttribute: 'data-error-for',
        errorTemplate: '${error}',
        showErrorAnimation: function (options) {
            var errorElement = options.errorElement;
            errorElement.show();
        },
        hideErrorAnimation: function (options) {
            var errorElement = options.errorElement;
            errorElement.hide();
        },
        render: function (data, tpl) {

            var render = tplRender[ tpl ];
            if (!render) {
                render = tplRender[ tpl ] = etpl.compile(tpl);
            }

            return render(data);
        }
    };

    return Validator;

});