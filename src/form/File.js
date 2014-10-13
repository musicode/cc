/**
 * @file 模拟 <input type="file" />
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var lifeCycle = require('cobble/function/lifeCycle');

    /**
     * 文件上传不好完全模拟
     * 比如上传地址，传统表单是写在 form 元素的 action 属性中
     *
     * 所以约定如下
     *
     * 上传地址: data-action="http://www.xxx.com/upload.php"
     * 上传格式：data-accept="jpg,png"
     */

    /**
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element <input type="file" /> 元素
     * @property {string} options.template 模版，包括 浏览、上传 按钮，可包含进度条
     * @property {string} options.browseSelector
     * @property {string} options.uploadSelector
     * @property {string=} options.progressSelector
     */
    function File(options) {
        return lifeCycle.init(this, options);
    }

    File.prototype = {

        constructor: File,

        type: 'File',

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;

            var faker = me.faker = $(me.template);

            element.before(faker);
            faker.find(me.browseSelector).append(element);

            var accept = element.data('accept');

            me.uploader = new Uploader({
                element: element,
                action: element.data('action'),
                accept: accept && accept.split(','),
                multiple: element.attr('multiple') === 'multiple'
            });
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.uploader.dispose();

            me.faker =
            me.element =
            me.uploader = null;
        }
    };

    File.defaultOptions = {
        browseSelector: '.browse-file',
        uploadSelector: '.upload-file',
        progressSelector: '.upload-progress',
        template: '<button class="btn btn-primary">选择文件</button>'
                + '<button class="btn btn-default">上传</button>'
    };

    /**
     * 是否支持 ajax 上传
     *
     * @inner
     * @return {boolean}
     */
    function supportAjaxUpload() {

        function supportFileAPI() {
            return 'files' in $('<input type="file" />')[0];
        }

        function supportAjaxUploadProgressEvents() {
           var xhr = new XMLHttpRequest();
           return ('upload' in xhr) && ('onprogress' in xhr.upload);
        }

        return supportFileAPI() && supportAjaxUploadProgressEvents();
    }

    var Uploader = supportAjaxUpload()
                 ? require('../helper/AjaxUploader')
                 : require('../helper/FlashUploader');


    return File;
});