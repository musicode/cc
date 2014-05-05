/**
 * @file FlashUploader
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * 如果出现 flash 跨域问题，有两种解决办法：
     *
     * 1. 可把 supload.swf 放到自己的域下，修改 FlashUploader.defaultOptions.flashUrl
     * 2. 放一个 crossdomain.xml 跨域配置文件
     */

    'use strict';

    require('../util/supload/supload');

    /**
     * 使用 flash 上传
     *
     * @constructor
     * @param {Object} options
     * @param {jQuery} options.element 点击打开文件选择框的元素
     * @param {string} options.action 上传地址
     * @param {boolean=} options.multiple 是否支持多文件上传
     * @param {Object=} options.data 上传的其他数据
     * @param {Array.<string>=} options.accept 可上传的文件类型，如
     *                                         [ 'jpg', 'png' ]
     *
     * @param {Function=} options.onFileChange
     * @param {function(Object)=} options.onUploadStart
     * @param {function(Object)=} options.onUploadProgress
     * @param {function(Object)=} options.onUploadSuccess
     * @param {function(Object)=} options.onUploadError
     * @param {function(Object)=} options.onUploadComplete
     */
    function FlashUploader(options) {
        $.extend(this, FlashUploader.defaultOptions, options);
        this.init();
    }

    FlashUploader.prototype = {

        constructor: FlashUploader,

        /**
         * 初始化
         */
        init: function () {

            var me = this;

            var swfOptions = {
                flashUrl: me.flashUrl,
                element: me.element[0],
                action: me.action,
                accept: me.accept ? me.accept.join(',') : '',
                multiple: me.multiple,
                data: me.data,
                fileName: me.fileName,
                customSettings: {
                    uploader: me
                }
            };

            for (var type in eventHandler) {
                // 首字母大写
                var onType = 'on' + type.charAt(0).toUpperCase() + type.substr(1);
                swfOptions[onType] = eventHandler[type];
            }

            me.supload = new Supload(swfOptions);
        },

        /**
         * 获取当前选择的文件
         *
         * @return {Array.<Object>}
         */
        getFiles: function () {
            return this.supload.getFiles();
        },

        /**
         * 上传文件
         */
        upload: function () {
            this.supload.upload();
        },

        /**
         * 停止上传
         */
        stop: function () {
            this.supload.cancel();
        },

        /**
         * 启用
         */
        enable: function () {
            this.supload.enable();
        },

        /**
         * 禁用
         */
        disable: function () {
            this.supload.disable();
        },

        /**
         * 销毁对象
         */
        dispose: function () {
            this.supload.dispose();
            this.supload =
            this.element = null;
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    FlashUploader.defaultOptions = {
        multiple: false,
        fileName: 'Filedata',
        flashUrl: require.toUrl('../util/supload/supload.swf')
    };

    /**
     * 等待上传状态
     *
     * @type {number}
     */
    FlashUploader.STATUS_WAITING = Supload.STATUS_WAITING;

    /**
     * 正在上传状态
     *
     * @type {number}
     */
    FlashUploader.STATUS_UPLOADING = Supload.STATUS_UPLOADING;

    /**
     * 上传成功状态
     *
     * @type {number}
     */
    FlashUploader.STATUS_UPLOAD_SUCCESS = Supload.STATUS_UPLOAD_SUCCESS;

    /**
     * 上传失败状态
     *
     * @type {number}
     */
    FlashUploader.STATUS_UPLOAD_ERROR = Supload.STATUS_UPLOAD_ERROR;

    /**
     * 上传中止错误
     *
     * @const
     * @type {number}
     */
    FlashUploader.ERROR_CANCEL = Supload.ERROR_CANCEL;

    /**
     * 上传出现沙箱安全错误
     *
     * @const
     * @type {number}
     */
    FlashUploader.ERROR_SECURITY = Supload.ERROR_SECURITY;

    /**
     * 上传 IO 错误
     *
     * @const
     * @type {number}
     */
    FlashUploader.ERROR_IO = Supload.ERROR_IO;

    /**
     * 事件处理函数
     *
     * @private
     * @type {Object}
     */
    var eventHandler = {

        fileChange: function () {
            var uploader = this.customSettings.uploader;
            if (typeof uploader.onFileChange === 'function') {
                uploader.onFileChange();
            }
        },

        /**
         * 开始上传
         *
         * @param {Object} data
         * @param {Object} data.fileItem
         */
        uploadStart: function (data) {
            var uploader = this.customSettings.uploader;
            if (typeof uploader.onUploadStart === 'function') {
                uploader.onUploadStart(data);
            }
        },

        /**
         * 正在上传
         *
         * @param {Object} data
         * @param {Object} data.fileItem
         * @param {number} data.uploaded
         * @param {number} data.total
         */
        uploadProgress: function (data) {
            var uploader = this.customSettings.uploader;
            if (typeof uploader.onUploadProgress === 'function') {
                uploader.onUploadProgress(data);
            }
        },

        /**
         * 上传成功
         *
         * @param {Object} data
         * @param {Object} data.fileItem
         * @param {string} data.response
         */
        uploadSuccess: function (data) {
            var uploader = this.customSettings.uploader;
            if (typeof uploader.onUploadSuccess === 'function') {
                uploader.onUploadSuccess(data);
            }
        },

        /**
         * 上传失败，失败原因可查看 errorCode
         *
         * @param {Object} data
         * @param {Object} data.fileItem
         * @param {number} data.errorCode
         */
        uploadError: function (data) {
            var uploader = this.customSettings.uploader;
            if (typeof uploader.onUploadError === 'function') {
                uploader.onUploadError(data);
            }
        },

        /**
         * 上传完成，在 成功/失败 之后触发
         *
         * @param {Object} data
         * @param {Object} data.fileItem
         */
        uploadComplete: function (data) {
            var uploader = this.customSettings.uploader;
            if (typeof uploader.onUploadComplete === 'function') {
                uploader.onUploadComplete(data);
            }
        }
    };


    return FlashUploader;

});
