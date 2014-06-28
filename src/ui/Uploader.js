/**
 * @file Uploader
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 是否支持 ajax 上传
     *
     * @inner
     * @return {boolean}
     */
    function supportAjaxUpload() {

        function supportFileAPI() {
            var input = document.createElement('input');
            input.type = 'file';
            return 'files' in input;
        }

        function supportAjaxUploadProgressEvents() {
           var xhr = new XMLHttpRequest();
           return ('upload' in xhr) && ('onprogress' in xhr.upload);
        }

        return supportFileAPI() && supportAjaxUploadProgressEvents();
    }

    return supportAjaxUpload()
         ? require('../helper/AjaxUploader')
         : require('../helper/FlashUploader');
});