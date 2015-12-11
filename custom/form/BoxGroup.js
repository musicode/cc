define(function (require, exports, module) {

    'use strict';

    var BoxGroup = require('cc/form/BoxGroup');

    BoxGroup.defaultOptions = {
        boxCheckedClass: 'checked',
        boxDisabledClass: 'disabled'
    };

    return BoxGroup;

});