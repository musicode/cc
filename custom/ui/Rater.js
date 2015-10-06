define(function (require, exports, module) {

    'use strict';

    var Rater = require('cc/ui/Rater');
    var etpl = require('cc/util/etpl');

    var render;

    Rater.defaultOptions = {
        minValue: 1,
        half: false,
        readOnly: false,
        itemSelector: 'i',
        mainTemplate: '<!-- for: ${list} as ${item} -->'
                    +     '<i class="icon-star'
                    +         '<!-- if: ${item.class} -->'
                    +             ' ${item.class}'
                    +         '<!-- /if -->" '
                    +         'data-value="${item.value}"'
                    +         '<!-- if: ${item.hint} -->'
                    +             ' data-title="${item.hint}"'
                    +         '<!-- /if -->'
                    +     '></i>'
                    + '<!-- /for -->',
        render: function (data, tpl) {
            if (!render) {
                render = etpl.compile(tpl);
            }
            return render(data);
        }
    };

    return Rater;

});