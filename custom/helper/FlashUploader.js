define(function (require, exports, module) {

    'use strict';

    var FlashUploader = require('cc/helper/FlashUploader');

    FlashUploader.defaultOptions = {
        multiple: false,
        fileName: 'Filedata',
        ignoreError: false,
        flashUrl: require.toUrl('cc/util/supload/supload.swf')
    };

    return FlashUploader;

});