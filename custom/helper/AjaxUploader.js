define(function (require, exports, module) {

    'use strict';

    var AjaxUploader = require('cc/helper/AjaxUploader');

    AjaxUploader.defaultOptions = {
        data: { },
        multiple: false,
        fileName: 'Filedata',
        ignoreError: false
    };

    return AjaxUploader;

});