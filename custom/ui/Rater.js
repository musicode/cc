define(function (require, exports, module) {

    'use strict';

    var Rater = require('cc/ui/Rater');
    var etpl = require('cc/util/etpl');

    var tplRender = { };

    Rater.defaultOptions = {
        minValue: 1,
        half: false,
        readOnly: false,
        itemSelector: 'i',
        valueAttribute: 'data-value',

        renderTemplate: '<!-- for: ${list} as ${item} -->'
                      +     '<i class="icon-star'
                      +         '<!-- if: ${item.className} -->'
                      +             ' ${item.className}'
                      +         '<!-- /if -->'
                      +         '" data-value="${item.value}"'
                      +         '<!-- if: ${item.hint} -->'
                      +             ' data-title="${item.hint}"'
                      +         '<!-- /if -->'
                      +     '></i>'
                      + '<!-- /for -->',

        render: function (data, tpl) {

            var render = tplRender[ tpl ];
            if (!render) {
                render = tplRender[ tpl ] = etpl.compile(tpl);
            }

            return render(data);

        }
    };

    return Rater;

});