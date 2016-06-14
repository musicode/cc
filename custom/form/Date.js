define(function (require, exports, module) {

    'use strict';

    var FormDate = require('cc/form/Date');
    var lpad = require('cc/function/lpad');
    var etpl = require('cc/util/etpl');

    var tplRender = { };

    FormDate.defaultOptions = {
        firstDay: 1,
        mode: 'month',
        toggle: false,
        multiple: false,
        stable: true,

        valueAttribute: 'data-value',
        parse: function (value) {
            var date = new Date(value);
            return date.getTime() > 0 ? date : null;
        },

        inputSelector: 'input[type="text"]',
        layerSelector: '.calendar',

        itemSelector: '[data-value]',
        itemActiveClass: 'checked',

        prevSelector: '.icon-chevron-left',
        nextSelector: '.icon-chevron-right',

        showLayerTrigger: 'focus',
        hideLayerTrigger: 'click',
        showLayerAnimation: function (options) {
            options.layerElement.show();
        },
        hideLayerAnimation: function (options) {
            options.layerElement.hide();
        },

        calendarTemplate: '<div class="header">'
                        +     '<i class="icon icon-chevron-left"></i>'
                        +     '<strong>${year}年${month}月</strong>'
                        +     '<i class="icon icon-chevron-right"></i>'
                        + '</div>'
                        + '<table class="body">'
                        +     '<thead>'
                        +          '<tr>'
                        +              '<th>一</th>'
                        +              '<th>二</th>'
                        +              '<th>三</th>'
                        +              '<th>四</th>'
                        +              '<th>五</th>'
                        +              '<th>六</th>'
                        +              '<th>日</th>'
                        +          '</tr>'
                        +     '</thead>'
                        +     '<tbody>'
                        +         '<!-- for: ${list} as ${item}, ${index} -->'
                        +         '<!-- if: ${index} % 7 === 0 -->'

                        +         '<!-- if: ${index} === 0 -->'
                        +         '<tr>'
                        +         '<!-- else -->'
                        +         '</tr>'
                        +         '<!-- /if -->'

                        +         '<!-- /if -->'

                        +             '<td class="${item.phase}'

                        +               '<!-- if: ${item.month} !== ${month} -->'
                        +               ' adjacent'
                        +               '<!-- /if -->'

                        +               '<!-- if: ${item.phase} === "past" && ${disablePast} === true -->'
                        +               ' disabled'
                        +               '<!-- /if -->'

                        +               '"'

                        +               '<!-- if: !(${item.phase} === "past" && ${disablePast} === true) -->'

                        +               ' data-value="${item.year}/'
                        +               '<!-- if: ${item.month} < 10 -->0<!-- /if -->'
                        +               '${item.month}/'
                        +               '<!-- if: ${item.date} < 10 -->0<!-- /if -->'
                        +               '${item.date}'
                        +               '"'

                        +               '<!-- /if -->'

                        +               ' data-year="${item.year}"'
                        +               ' data-month="${item.month}"'
                        +               ' data-date="${item.date}">'
                        +                 '${item.date}'
                        +             '</td>'

                        +         '<!-- /if -->'
                        +         '<!-- /for -->'
                        +     '</tbody>'
                        + '</table>',

        render: function (data, tpl) {

            var render = tplRender[ tpl ];
            if (!render) {
                render = tplRender[ tpl ] = etpl.compile(tpl);
            }

            data.disablePast = this.option('disablePast');

            return render(data);

        }
    };

    return FormDate;

});