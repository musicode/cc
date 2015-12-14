define(function (require, exports, module) {

    'use strict';

    var ComboBox = require('cc/ui/ComboBox');

    ComboBox.defaultOptions = {

        itemSelector: '.item',

        textAttribute: 'data-text',
        valueAttribute: 'data-value',

        defaultText: '- 请选择 -',
        menuActiveClass: 'opened',
        itemActiveClass: 'checked',

        showMenuTrigger: 'click',
        hideMenuTrigger: 'click',
        showMenuAnimation: function (options) {
            options.menuElement.show();
        },
        hideMenuAnimation: function (options) {
            options.menuElement.hide();
        },
        setText: function (options) {
            options.buttonElement.find('span').html(options.text);
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
                        '<li class="item"' + attr + '>' + item.text + '</a></li>'
                    );
                }
            );

            return html.join('');

        }
    };

    return ComboBox;

});