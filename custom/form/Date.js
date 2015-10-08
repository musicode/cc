define(function (require, exports, module) {

    'use strict';

    var Date = require('cc/form/Date');
    var lpad = require('cc/function/lpad');

    Date.defaultOptions = {
        firstDay: 1,
        mode: 'month',
        toggle: false,
        multiple: false,
        stable: true,

        valueAttribute: 'data-value',
        parse: require('cc/function/parseDate'),

        inputSelector: ':text',
        layerSelector: '.calendar',

        itemSelector: '[data-value]',
        itemActiveClass: 'active',

        prevSelector: '.fa-chevron-left',
        nextSelector: '.fa-chevron-right',

        showLayerTrigger: 'focus',
        hideLayerTrigger: 'blur,click',
        showLayerAnimation: function (options) {
            options.layerElement.show();
        },
        hideLayerAnimation: function (options) {
            options.layerElement.hide();
        },

        render: function (data, tpl) {

            $.each(
                data.list,
                function (index, item) {

                    item.value = [
                        item.year,
                        lpad(item.month, 2),
                        lpad(item.date, 2)
                    ].join('-');

                }
            );

            var html = [
                '<div class="calendar-heading">',
                    '<i class="fa fa-chevron-left"></i>',
                    '<strong>', data.year, '年', data.month, '月</strong>',
                    '<i class="fa fa-chevron-right"></i>',
                '</div>',
                '<table class="calendar-body">',
                      '<thead>',
                          '<tr>',
                              '<th>一</th>',
                              '<th>二</th>',
                              '<th>三</th>',
                              '<th>四</th>',
                              '<th>五</th>',
                              '<th>六</th>',
                              '<th>日</th>',
                          '</tr>',
                      '</thead>',
                      '<tbody>'
            ];

            var isMonthMode = this.option('mode') === 'month';

            $.each(
                data.list,
                function (index, item) {

                    if (index % 7 === 0) {
                        html.push(
                            index === 0 ? '<tr>' : '</tr>'
                        );
                    }

                    var classList = [ item.phase ];
                    if (isMonthMode && item.month != data.month) {
                        classList.push('adjacent');
                    }

                    html.push(
                        '<td class="' + classList.join(' ') + '"',
                        ' data-value="' + item.value + '"',
                        ' data-year="' + item.year + '"',
                        ' data-month="' + item.month + '"',
                        ' data-date="' + item.date + '">',
                        item.date,
                        '</td>'
                    );

                }
            );

            html.push('</tbody></table>');

            return html.join('');

        }
    };

    return Date;

});