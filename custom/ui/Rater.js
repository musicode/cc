define(function (require, exports, module) {

    'use strict';

    var Rater = require('cc/ui/Rater');

    Rater.defaultOptions = {
        minValue: 1,
        half: false,
        readOnly: false,
        itemSelector: 'i',
        itemTemplate: '<i class="${class}" data-value="${value}" title="${hint}"></i>',
        render: function (data, tpl) {
            return tpl.replace(/\${(\w+)}/g, function ($0, $1) {
                return data[$1] != null ? data[$1] : '';
            });
        }
    };

    return Rater;

});