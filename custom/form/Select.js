define(function (require, exports, module) {

    'use strict';

    var Select = require('cc/form/Select');

    Select.defaultOptions = {

        buttonSelector: '> .button',
        menuSelector: '> .menu',
        labelSelector: '> .button > .text',

        itemSelector: 'li',
        itemActiveClass: 'active',

        textAttribute: 'data-text',
        valueAttribute: 'data-value',

        defaultText: '- 请选择 -',
        menuActiveClass: 'opened',

        showMenuTrigger: 'click',
        hideMenuTrigger: 'click',
        showMenuAnimation: function (options) {
            options.menuElement.show();
        },
        hideMenuAnimation: function (options) {
            options.menuElement.hide();
        },

        render: function (data) {

            var html = [ ];

            $.each(
                data,
                function (index, item) {

                    var data = [ ];

                    $.each(
                        item,
                        function (key, value) {
                            if (key !== 'text' && value != null) {
                                data.push(
                                    'data-' + key + '="' + value + '"'
                                );
                            }
                        }
                    );

                    var attr = data.join(' ');
                    if (attr) {
                        attr = ' ' + attr;
                    }

                    html.push(
                        '<li class="item"' + attr + '>' + item.text + '</li>'
                    );
                }
            );

            return html.join('');

        }
    };

    return Select;

});