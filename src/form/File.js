/**
 * @file 模拟 <input type="file" />
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

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
     *
     */

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var Uploader = require('../ui/Uploader');

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

    var proto = File.prototype;

    proto.type = 'File';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;
        var element = me.element;
        var browseSelector = me.browseSelector;

        var mainElement;

        if (element.find(browseSelector).length === 1) {
            mainElement = element;
            element = mainElement.find(':file');
        }
        else {
            mainElement = $(me.template);
            element.before(mainElement);
            mainElement.find(browseSelector).append(element);
        }

        me.main = mainElement;
        me.element = element;

        var accept = element.data('accept');

        me.uploader = new Uploader({
            element: element,
            action: element.data('action'),
            accept: accept && accept.split(','),
            multiple: element.attr('multiple') === 'multiple'
        });

        mainElement
        .on('click' + namespace, me.uploadSelector, function () {
            me.uploader.upload();
        });

    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.main.off(namespace);
        me.uploader.dispose();

        me.main =
        me.element =
        me.uploader = null;

    };

    jquerify(proto);

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
        template: '<div class="uploader">'
                +     '<div class="upload-progress"></div>'
                +     '<button class="btn-primary browse-file">选择文件</button>'
                +     '<button class="btn-default upload-file">上传</button>'
                + '</div>'
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_form_file';


    return File;

});