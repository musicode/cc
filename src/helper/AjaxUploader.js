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
     */

    var getRatio = require('../function/ratio');

    var lifeUtil = require('../util/life');
    var mimeTypeUtil = require('../util/mimeType');

    /**
     * 使用 HTML5 ajax 上传
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 点击打开文件选择框的元素
     * @property {string} options.action 上传地址
     * @property {boolean=} options.multiple 是否支持多文件上传
     * @property {Object=} options.data 上传的其他数据
     * @property {string=} options.fileName 上传文件的 name 值
     * @property {boolean=} options.ignoreError 多文件上传，当某个文件上传失败时，是否继续上传后面的文件
     * @property {Array.<string>=} options.accept 可上传的文件类型，如
     *                                            [ 'jpg', 'png' ]
     * @property {boolean=} options.useChunk 是否使用分片上传
     * @property {number=} options.chunkSize 分片大小
     *
     */
    function AjaxUploader(options) {
        lifeUtil.init(this, options);
    }

    var proto = AjaxUploader.prototype;

    proto.type = 'AjaxUploader';

    proto.init = function () {

        var me = this;

        var fileElement = me.option('mainElement');


        // 确保是文件上传控件
        if (!fileElement.is(':file')) {
            me.error('AjaxUploader mainElement must be <input type="file" />.');
        }

        // 用一个 form 元素包着，便于重置
        var mainElement = $('<form></form>');

        fileElement.replaceWith(mainElement);
        mainElement.append(fileElement);



        // 完善元素属性
        var properties = { };

        if (me.option('accept')) {
            properties.accept = formatAccept(me.option('accept'));
        }

        if (me.option('multiple')) {
            properties.multiple = true;
        }



        fileElement
        .prop(properties)
        .on(
            'change' + me.namespace(),
            function () {

                setFiles(me, fileElement.prop('files'));

                me.emit('filechange');

            }
        );

        /**
         * 文件队列，格式如下：
         * {
         *     index: 0,  // 当前上传文件的索引
         *     files: [], // 上传文件列表
         * }
         *
         * @type {Object}
         */
        me.inner({
            main: mainElement,
            file: fileElement,
            fileQueue: { }
        });

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
        return this.inner('fileQueue').files || [ ];
    };

    /**
     * 设置上传地址
     *
     * @param {string} action
     */
    proto.setAction = function (action) {
        this.option('action', action);
    };

    /**
     * 设置上传数据
     *
     * @param {Object} data 需要一起上传的数据
     */
    proto.setData = function (data) {

        var currentData = this.option('data');

        if ($.isPlainObject(currentData)) {
            $.extend(currentData, data);
        }
        else {
            currentData = data;
        }

        this.option('data', currentData);

    };

    /**
     * 重置
     */
    proto.reset = function () {
        // 避免出现停止后选择相同文件，不触发 change 事件的问题
        this.inner('main')[0].reset();
    };

    /**
     * 上传文件
     */
    proto.upload = function (fileItem) {

        var me = this;

        var validStatus = me.option('useChunk')
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

        xhr.open('post', me.option('action'), true);

        var upload = me.option('useChunk') ? uploadChunk : uploadFile;

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
        this.option('file').prop('disabled', false);
    };

    /**
     * 禁用
     */
    proto.disable = function () {
        this.option('file').prop('disabled', true);
    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.stop();

        me.inner('file').off(
            me.namespace()
        );

    };

    lifeUtil.extend(proto);

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
     * 上传整个文件
     *
     * @inner
     * @param {AjaxUploader} uploader
     * @param {Object} fileItem
     */
    function uploadFile(uploader, fileItem) {

        var formData = new FormData();

        $.each(
            uploader.option('data'),
            function (key, value) {
                formData.append(key, value);
            }
        );

        formData.append(
            uploader.option('fileName'),
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
        // 碰到过传了几个分片之后，file.size 变成 0 的情况
        // 因此 fileSize 从最初的格式化对象中取比较保险
        var fileSize = fileItem.file.size;

        var chunkInfo = fileItem.chunk;
        if (!chunkInfo) {
            chunkInfo =
            fileItem.chunk = { index: 0, uploaded: 0 };
        }

        var chunkIndex = chunkInfo.index;

        var chunkSize = uploader.option('chunkSize');
        var start = chunkSize * chunkIndex;
        var end = chunkSize * (chunkIndex + 1);
        if (end > fileSize) {
            end = fileSize;
        }

        // 正在上传分片的大小
        chunkInfo.uploading = end - start;

        var range = 'bytes ' + (start + 1) + '-' + end + '/' + fileSize;

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
                    'uploadstart',
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
                        var event = uploader.emit('chunkuploadsuccess', data);
                        if (!event.isDefaultPrevented()) {
                            chunkInfo.index++;
                            uploader.upload();
                        }

                        return;
                    }
                }

                fileItem.status = AjaxUploader.STATUS_UPLOAD_SUCCESS;

                uploader.emit('uploadsuccess', data);

                uploadComplete(uploader, fileItem);

            }
        },

        uploadError: {
            type: 'error',
            handler: function (uploader, e, errorCode) {

                var fileItem = getCurrentFileItem(uploader);
                fileItem.status = AjaxUploader.STATUS_UPLOAD_ERROR;

                uploader.emit(
                    'uploaderror',
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
                    'uploadprogress',
                    {
                        fileItem: fileItem,
                        uploaded: uploaded,
                        total: total,
                        percent: 100 * getRatio(uploaded, total) + '%'
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
            'uploadcomplete',
            {
                fileItem: fileItem
            }
        );

        if (fileItem.status === AjaxUploader.STATUS_UPLOAD_SUCCESS
            || (fileItem.status === AjaxUploader.STATUS_UPLOAD_ERROR
                && uploader.option('ignoreError'))
        ) {

            var index = fileItem.index + 1;
            var fileQueue = uploader.inner('fileQueue');

            if (index < fileQueue.files.length) {
                fileQueue.index = index;
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

        var fileQueue = uploader.inner('fileQueue');

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
        var fileQueue = uploader.inner('fileQueue');
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
                if (mimeTypeUtil[ name ]) {
                    result.push(
                        mimeTypeUtil[ name ]
                    );
                }
            }
        );

        return $.unique(result).join(',');

    }

    /**
     * 格式化文件对象
     *
     * @inner
     * @param {Object} file
     * @property {string} file.name 文件名称
     * @property {number} file.size 文件大小
     * @return {Object}
     */
    function formatFile(file) {

        var name = file.name;
        var parts = name.split('.');
        var type = parts.length > 1
                 ? parts.pop().toLowerCase()
                 : '';

        return {
            name: name,
            type: type,
            size: file.size
        };

    }


    return AjaxUploader;

});
