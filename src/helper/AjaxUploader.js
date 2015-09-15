/**
 * @file AjaxUploader
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * ## 多文件上传
     *
     *     实质是文件多选，最终还是一个一个上传文件的，并非同时上传
     *
     * ## 文件格式
     *
     *     html 的规范是 MIME type，如 audio/*, video/*
     *     具体可见 http://www.iana.org/assignments/media-types
     *
     *     但鉴于这种方式不直观(小白可能都没听过 MIME type)，还是用扩展名好了
     *
     * ## 事件列表
     *
     * 1. fileChange
     * 2. uploadStart
     * 3. uploadProgress
     * 4. uploadSuccess
     * 5. uploadChunkSuccess
     * 6. uploadError
     * 7. uploadComplete
     */

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');

    var percent = require('../function/percent');
    var formatFile = require('../function/formatFile');

    var ext2MimeType = require('../util/mimeType');

    /**
     * 使用 HTML5 ajax 上传
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 点击打开文件选择框的元素
     * @property {string} options.action 上传地址
     * @property {boolean=} options.multiple 是否支持多文件上传
     * @property {Object=} options.data 上传的其他数据
     * @property {string=} options.fileName 上传文件的 name 值，默认是 Filedata
     * @property {boolean=} options.ignoreError 多文件上传，当某个文件上传失败时，是否继续上传后面的文件，默认为 false
     * @property {Array.<string>=} options.accept 可上传的文件类型，如
     *                                            [ 'jpg', 'png' ]
     * @property {boolean=} options.useChunk 是否使用分片上传，默认为 false
     * @property {number=} options.chunkSize 分片大小
     *
     */
    function AjaxUploader(options) {
        return lifeCycle.init(this, options);
    }

    var proto = AjaxUploader.prototype;


    proto.type = 'AjaxUploader';

    /**
     * 初始化元素和事件
     */
    proto.init = function () {

        var me = this;

        /**
         * 文件队列，格式如下：
         * {
         *     index: 0,  // 当前上传文件的索引
         *     files: [], // 上传文件列表
         * }
         *
         * @type {Object}
         */
        me.fileQueue = { };

        var element = me.element;

        // 确保是文件上传控件
        if (!element.is(':file')) {
            throw new Error('AjaxUploader element must be <input type="file" />');
        }

        // 用一个 form 元素包着，便于重置
        var faker = me.faker = $('<form></form>');
        element.replaceWith(faker);
        faker.append(element);

        // 完善元素属性
        var properties = { };

        if (me.accept) {
            properties.accept = formatAccept(me.accept);
        }

        if (me.multiple) {
            properties.multiple = true;
        }

        element.prop(properties);

        element.on(
            'change' + namespace,
            function () {

                setFiles(me, element.prop('files'));

                me.emit('fileChange');

            }
        );

        me.emit('ready');

    };

    /**
     * 获取选择的文件
     *
     * @return {Array.<Object>} 对象格式为
     *                          {
     *                              index: 0,         // 文件索引
     *                              file: { },        // 标准文件对象
     *                              nativeFile: File, // 原生文件对象
     *                              status: 0         // 文件状态：等待上传，上传中，上传成功，上传失败等
     *                          }
     *
     */
    proto.getFiles = function () {
        return this.fileQueue.files || [ ];
    };

    /**
     * 设置上传地址
     *
     * @param {string} action
     */
    proto.setAction = function (action) {
        this.action = action;
    };

    /**
     * 设置上传数据
     *
     * @param {Object} data 需要一起上传的数据
     */
    proto.setData = function (data) {
        $.extend(this.data, data);
    };

    /**
     * 重置
     */
    proto.reset = function () {
        // 避免出现停止后选择相同文件，不触发 change 事件的问题
        this.faker[0].reset();
    };

    /**
     * 上传文件
     */
    proto.upload = function (fileItem) {

        var me = this;

        var validStatus = me.useChunk
                        ? AjaxUploader.STATUS_UPLOADING
                        : AjaxUploader.STATUS_WAITING;

        fileItem = fileItem || getCurrentFileItem(me);
        if (!fileItem || fileItem.status > validStatus) {
            return;
        }

        var xhr = new XMLHttpRequest();
        fileItem.xhr = xhr;

        $.each(
            xhrEventHandler,
            function (index, item) {
                xhr['on' + item.type] = function (e) {
                    item.handler(me, e);
                };
            }
        );

        $.each(
            uploadEventHandler,
            function (index, item) {
                xhr.upload['on' + item.type] = function (e) {
                    item.handler(me, e);
                };
            }
        );

        xhr.open('post', me.action, true);

        var upload = me.useChunk ? uploadChunk : uploadFile;

        upload(me, fileItem);

    };

    /**
     * 停止上传
     */
    proto.stop = function () {

        var me = this;
        var fileItem = getCurrentFileItem(me);
        if (fileItem && fileItem.status === AjaxUploader.STATUS_UPLOADING) {
            fileItem.xhr.abort();
        }

        me.reset();

    };

    /**
     * 启用
     */
    proto.enable = function () {
        this.element.prop('disabled', false);
    };

    /**
     * 禁用
     */
    proto.disable = function () {
        this.element.prop('disabled', true);
    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.stop();
        me.element.off(namespace);

        me.faker =
        me.element =
        me.fileQueue = null;

    };

    jquerify(proto);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    AjaxUploader.defaultOptions = {
        data: { },
        multiple: false,
        fileName: 'Filedata',
        ignoreError: false
    };

    /**
     * 是否支持分块上传
     *
     * @static
     * @type {boolean}
     */
    AjaxUploader.supportChunk = typeof FileReader !== 'undefined';

    /**
     * 等待上传状态
     *
     * @const
     * @type {number}
     */
    AjaxUploader.STATUS_WAITING = 0;

    /**
     * 正在上传状态
     *
     * @const
     * @type {number}
     */
    AjaxUploader.STATUS_UPLOADING = 1;

    /**
     * 上传成功状态
     *
     * @const
     * @type {number}
     */
    AjaxUploader.STATUS_UPLOAD_SUCCESS = 2;

    /**
     * 上传失败状态
     *
     * @const
     * @type {number}
     */
    AjaxUploader.STATUS_UPLOAD_ERROR = 3;

    /**
     * 上传中止错误
     *
     * @const
     * @type {number}
     */
    AjaxUploader.ERROR_CANCEL = 0;

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_helper_ajaxuploader';

    /**
     * 上传整个文件
     *
     * @inner
     * @param {AjaxUploader} uploader
     * @param {Object} fileItem
     */
    function uploadFile(uploader, fileItem) {

        var formData = new FormData();

        $.each(
            uploader.data,
            function (key, value) {
                formData.append(key, value);
            }
        );

        formData.append(
            uploader.fileName,
            fileItem.nativeFile
        );

        fileItem.xhr.send(formData);
    }

    /**
     * 上传文件的一个分片
     *
     * @inner
     * @param {AjaxUploader} uploader
     * @param {Object} fileItem
     */
    function uploadChunk(uploader, fileItem) {

        var file = fileItem.nativeFile;

        var chunkInfo = fileItem.chunk;
        if (!chunkInfo) {
            chunkInfo =
            fileItem.chunk = { index: 0, uploaded: 0 };
        }

        var chunkIndex = chunkInfo.index;

        var chunkSize = uploader.chunkSize;
        var start = chunkSize * chunkIndex;
        var end = chunkSize * (chunkIndex + 1);
        if (end > file.size) {
            end = file.size;
        }

        // 正在上传分片的大小
        chunkInfo.uploading = end - start;

        var range = 'bytes ' + (start + 1) + '-' + end + '/' + file.size;

        var xhr = fileItem.xhr;

        xhr.setRequestHeader('Content-Type', '');
        xhr.setRequestHeader('X_FILENAME', encodeURIComponent(file.name));
        xhr.setRequestHeader('Content-Range', range);

        xhr.send(file.slice(start, end));
    }

    /**
     * 事件处理函数
     *
     * @inner
     * @type {Object}
     */
    var xhrEventHandler = {

        uploadStart: {
            type: 'loadstart',
            handler: function (uploader, e) {

                var fileItem = getCurrentFileItem(uploader);
                fileItem.status = AjaxUploader.STATUS_UPLOADING;

                uploader.emit(
                    'uploadStart',
                    {
                        fileItem: fileItem
                    }
                );

            }
        },

        uploadSuccess: {
            type: 'load',
            handler: function (uploader, e) {

                var fileItem = getCurrentFileItem(uploader);
                var data = {
                    fileItem: fileItem,
                    responseText: fileItem.xhr.responseText
                };

                var chunkInfo = fileItem.chunk;
                if (chunkInfo) {

                    chunkInfo.uploaded += chunkInfo.uploading;

                    if (chunkInfo.uploaded < fileItem.file.size) {

                        // 分片上传成功
                        uploader.emit('chunkUploadSuccess', data);

                        chunkInfo.index++;
                        uploader.upload();

                        return;
                    }
                }

                fileItem.status = AjaxUploader.STATUS_UPLOAD_SUCCESS;

                uploader.emit('uploadSuccess', data);

                uploadComplete(uploader, fileItem);

            }
        },

        uploadError: {
            type: 'error',
            handler: function (uploader, e, errorCode) {

                var fileItem = getCurrentFileItem(uploader);
                fileItem.status = AjaxUploader.STATUS_UPLOAD_ERROR;

                uploader.emit(
                    'uploadError',
                    {
                        fileItem: fileItem,
                        errorCode: errorCode
                    }
                );

                uploadComplete(uploader, fileItem);
            }
        },

        uploadStop: {
            type: 'abort',
            handler: function (uploader, e) {
                xhrEventHandler
                .uploadError
                .handler(uploader, e, AjaxUploader.ERROR_CANCEL);
            }
        }
    };

    var uploadEventHandler = {

        uploadProgress: {
            type: 'progress',
            handler: function (uploader, e) {

                var fileItem = getCurrentFileItem(uploader);

                var total = fileItem.file.size;
                var uploaded = e.loaded;

                var chunkInfo = fileItem.chunk;
                if (chunkInfo) {
                    uploaded += chunkInfo.uploaded;
                }

                uploader.emit(
                    'uploadProgress',
                    {
                        fileItem: fileItem,
                        uploaded: uploaded,
                        total: total,
                        percent: percent(uploaded, total)
                    }
                );

            }
        }


    };

    /**
     * 上传完成后执行
     *
     * @inner
     * @param {AjaxUploader} uploader
     * @param {Object} fileItem
     */
    function uploadComplete(uploader, fileItem) {

        var xhr = fileItem.xhr;
        if (xhr) {

            $.each(
                xhrEventHandler,
                function (index, item) {
                    xhr['on' + item.type] = null;
                }
            );

            $.each(
                uploadEventHandler,
                function (index, item) {
                    xhr.upload['on' + item.type] = null;
                }
            );

            delete fileItem.xhr;
        }

        uploader.emit(
            'uploadComplete',
            {
                fileItem: fileItem
            }
        );

        if (fileItem.status === AjaxUploader.STATUS_UPLOAD_SUCCESS
            || (fileItem.status === AjaxUploader.STATUS_UPLOAD_ERROR && uploader.ignoreError)
        ) {
            var index = fileItem.index + 1;
            if (index < uploader.fileQueue.files.length) {
                uploader.fileQueue.index = index;
                uploader.upload();
            }
            else {
                setFiles(uploader, [ ]);
            }
        }
    }

    /**
     * 设置选择的文件
     *
     * @inner
     * @param {AjaxUploader} uploader
     * @param {Array.<File>} files
     */
    function setFiles(uploader, files) {

        var fileQueue = uploader.fileQueue;

        fileQueue.index = 0;
        fileQueue.files = $.map(
            files,
            function (nativeFile, index) {
                return {
                    index: index,
                    file: formatFile(nativeFile),
                    nativeFile: nativeFile,
                    status: AjaxUploader.STATUS_WAITING
                };
            }
        );
    }

    /**
     * 获取当前正在上传的文件
     *
     * @inner
     * @param {AjaxUploader} uploader
     * @return {?Object}
     */
    function getCurrentFileItem(uploader) {
        var fileQueue = uploader.fileQueue;
        var index = fileQueue.index;
        if (fileQueue.files && $.type(index) === 'number') {
            return fileQueue.files[index];
        }
    }

    /**
     * 把 [ 'jpg', 'png' ] 格式的 accept 转为
     * 浏览器可识别的 'image/jpg,image/png'
     *
     * @inner
     * @param {Array.<string>} accept
     * @return {string}
     */
    function formatAccept(accept) {

        var result = [ ];

        $.each(
            accept,
            function (index, name) {
                if (ext2MimeType[name]) {
                    result.push(
                        ext2MimeType[name]
                    );
                }
            }
        );

        return $.unique(result).join(',');

    }

    return AjaxUploader;

});
