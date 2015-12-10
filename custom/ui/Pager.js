define(function (require, exports, module) {

    'use strict';

    var Pager = require('cc/ui/Pager');
    var etpl = require('cc/util/etpl');

    var tplRender = { };

    Pager.defaultOptions = {

        hideOnSingle: true,

        showCount: 6,
        startCount: 1,
        endCount: 2,

        pageAttribute: 'data-page',
        pageSelector: '[data-page]',

        prevTemplate: '<li class="item button'

                    + '<!-- if: ${active} === ${first} -->'
                    +     ' disabled"'
                    + '<!-- else -->'
                    +     '<!-- var: prev = ${active} - 1 -->'
                    +     '"data-page="${prev}"'
                    + '<!-- /if -->'

                    + '>'
                    +     '<i class="fa fa-angle-double-left"></i>'
                    + '</li>',

        nextTemplate: '<li class="item button'

                    + '<!-- if: ${active} === ${last} -->'
                    +     ' disabled"'
                    + '<!-- else -->'
                    +     '<!-- var: next = ${active} + 1 -->'
                    +     '" data-page="${next}"'
                    + '<!-- /if -->'

                    + '>'
                    +     '<i class="fa fa-angle-double-right"></i>'
                    + '</li>',

        pageTemplate: '<li class="item button'
                    + '<!-- if: ${active} === ${page} -->'
                    +     ' checked'
                    + '<!-- /if -->'
                    + '" data-page="${page}">'
                    +     '${page}'
                    + '</li>',

        ellipsisTemplate: '<li class="item">'
                        +     '...'
                        + '</li>',

        render: function (data, tpl) {

            var render = tplRender[ tpl ];
            if (!render) {
                render = tplRender[ tpl ] = etpl.compile(tpl);
            }

            return render(data);

        },

        showAnimation: function (options) {
            options.mainElement.show();
        },

        hideAnimation: function (options) {
            options.mainElement.hide();
        }
    };

    return Pager;

});