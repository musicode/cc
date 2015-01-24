/**
 * @file 模拟 <input type="file" />
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var Uploader = require('../ui/Uploader');

    /**
     *
     * ## 格式说明
     *
     * 文件上传不好完全模拟
     * 比如上传地址，传统表单是写在 form 元素的 action 属性中
     *
     * 所以约定如下
     *
     * 上传地址: data-action="http://www.xxx.com/upload.php"
     * 上传格式：data-accept="jpg,png"
     *
     * ## 模板
     *
     * 可以直接传入 <input type="file" />
     * 或传入包含 <input type="file" /> 的、具有完整模板的容器元素
     */

    /**
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element <input type="file" /> 元素，如果模板完整，可传容器元素
     * @property {string=} options.template 模版，包括 浏览、上传 按钮，可包含进度条
     * @property {string=} options.browseSelector
     * @property {string=} options.uploadSelector
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
            var browseSelector = me.browseSelector;

            var faker;

            if (element.find(browseSelector).length === 1) {
                faker = element;
                element = faker.find(':file');
            }
            else {
                faker = $(me.template);
                element.before(faker);
                faker.find(browseSelector).append(element);
            }

            me.faker = faker;
            me.element = element;

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

    jquerify(File.prototype);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    File.defaultOptions = {
        browseSelector: '.browse-file',
        uploadSelector: '.upload-file',
        progressSelector: '.upload-progress',
        template: '<button class="btn-primary browse-file">选择文件</button>'
                + '<button class="btn-default upload-file">上传</button>'
    };


    return File;

});