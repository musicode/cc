define(function (require, exports, module) {

    'use strict';

    var Select = require('cc/form/Select');

    Select.defaultOptions = {

        buttonSelector: '.btn-default',
        menuSelector: '.dropdown-menu',
        labelSelector: '.btn-default > span',

        itemSelector: 'li',
        itemActiveClass: 'active',

        textAttribute: 'data-text',
        valueAttribute: 'data-value',

        showMenuTrigger: 'click',
        hideMenuTrigger: 'click',

        showMenuAnimation: function (options) {
            options.menuElement.show();
        },
        hideMenuAnimation: function (options) {
            options.menuElement.hide();
        }
    };

    return Select;

});