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

        prevTemplate: '<li class="page-prev'

                    + '<!-- if: ${active} === ${first} -->'
                    +     ' disabled"'
                    + '<!-- else -->'
                    +     '<!-- var: prev = ${active} - 1 -->'
                    +     '"data-page="${prev}"'
                    + '<!-- /if -->'

                    + '>'
                    +     '<span><i class="fa fa-angle-double-left"></i></span>'
                    + '</li>',

        nextTemplate: '<li class="page-prev'

                    + '<!-- if: ${active} === ${last} -->'
                    +     ' disabled"'
                    + '<!-- else -->'
                    +     '<!-- var: next = ${active} + 1 -->'
                    +     '" data-page="${next}"'
                    + '<!-- /if -->'

                    + '>'
                    +     '<span><i class="fa fa-angle-double-right"></i></span>'
                    + '</li>',

        pageTemplate: '<li data-page="${page}">'
                    +     '<span>${page}</span>'
                    + '</li>',

        ellipsisTemplate: '<li class="disabled">'
                        +     '<span>...</span>'
                        + '</li>',

        activeTemplate: '<li class="active">'
                      +     '<span>${active}</span>'
                      + '</li>',

        render: function (data, tpl) {

            var render = tplRender[ tpl ];
            if (!render) {
                render = tplRender[ tpl ] = etpl.compile(tpl);
            }

            return render(data);

        },

        showAnimation: function (options) {
            options.mainElement.removeClass('invisible');
        },

        hideAnimation: function (options) {
            options.mainElement.addClass('invisible');
        }
    };

    return Pager;

});