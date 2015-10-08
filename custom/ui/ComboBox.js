define(function (require, exports, module) {

    'use strict';

    var ComboBox = require('cc/ui/ComboBox');

    ComboBox.defaultOptions = {

        itemSelector: 'li > a',
        itemActiveClass: 'active',

        textAttribute: 'data-text',
        valueAttribute: 'data-value',

        defaultText: '- 请选择 -',
        menuActiveClass: 'open',
        itemActiveClass: 'active',

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
                        '<li><a' + attr + '>' + item.text + '</a></li>'
                    );
                }
            );

            return html.join('');

        },
        onafterinit: function () {

            var me = this;

            me
            .before('open', function (e, data) {
                var event = data.event;
                if (event) {
                    event.preventDefault();
                }
            })
            .on('select', function (e) {
                e.preventDefault();
            });

        }
    };

    return ComboBox;

});