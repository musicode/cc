/**
 * @file 上传
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    function supportFileAPI() {
        return 'files' in $('<input type="file" />')[0];
    }

    function supportAjaxUploadProgressEvents() {

        if (!XMLHttpRequest) {
            return false;
        }

        var xhr = new XMLHttpRequest();
        return ('upload' in xhr) && ('onprogress' in xhr.upload);
    }

    return supportFileAPI() && supportAjaxUploadProgressEvents()
         ? require('../helper/AjaxUploader')
         : require('../helper/FlashUploader');

});