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
    var restrain = require('../function/restrain');
    var nextTick = require('../function/nextTick');

    var lifeUtil = require('../util/life');
    var eventUtil = require('../util/event');
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
     * @property {Object=} options.header 请求头
     * @property {string=} options.fileName 上传文件的 name 值
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
        if (!fileElement.is('input[type="file"]')) {
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

                $.each(
                    me.getFiles(),
                    function (index, fileItem) {
                        fileItem.dispose();
                    }
                );

                me.inner(
                    'files',
                    $.map(
                        fileElement.prop('files'),
                        function (file, index) {
                            return new FileItem({
                                nativeFile: file,
                                index: index
                            });
                        }
                    )
                );

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
            files: [ ]
        });

        me.set({
            action: me.option('action'),
            data: me.option('data')
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
        return this.inner('files');
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
     *
     * @param {number} index
     * @param {Object=} fileItem
     */
    proto.upload = function (index, fileItem) {

        var me = this;

        if (!fileItem) {
            fileItem = me.getFiles()[index];
        }
        else {
            fileItem = new FileItem(fileItem);
            me.getFiles()[index] = fileItem;
        }

        if (fileItem) {
            if (
                fileItem.upload({
                    action: me.get('action'),
                    data: me.get('data'),
                    fileName: me.option('fileName'),
                    header: me.option('header'),
                    useChunk: me.option('useChunk'),
                    chunkSize: me.option('chunkSize')
                })
            ) {
                var dispatchEvent = function (e, data) {
                    me.emit(e, data);
                };
                fileItem
                    .on('uploadstart', dispatchEvent)
                    .on('uploadprogress', dispatchEvent)
                    .on('uploadsuccess', dispatchEvent)
                    .on('uploaderror', dispatchEvent)
                    .on('uploadcomplete', dispatchEvent)
                    .on('chunkuploadsuccess', dispatchEvent);
            }
        }

    };

    /**
     * 停止上传
     */
    proto.stop = function (index) {
        var fileItem = this.getFiles()[index];
        if (fileItem) {
            fileItem.cancel();
        }
    };

    /**
     * 启用
     */
    proto.enable = function () {
        this.inner('file').prop('disabled', false);
    };

    /**
     * 禁用
     */
    proto.disable = function () {
        this.inner('file').prop('disabled', true);
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

    lifeUtil.extend(proto, ['getFiles', 'setAction', 'setData']);

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
     * 上传分片大小错误
     *
     * @const
     * @type {number}
     */
    AjaxUploader.ERROR_CHUNK_SIZE = -1;


    /**
     * 事件处理函数
     *
     * @inner
     * @type {Object}
     */
    var xhrEventHandler = {

        uploadStart: {
            type: 'loadstart',
            handler: function (fileItem, e) {
                fileItem.status = AjaxUploader.STATUS_UPLOADING;
                fileItem.emit(
                    'uploadstart',
                    {
                        fileItem: fileItem.toPlainObject()
                    }
                );
            }
        },

        uploadSuccess: {
            type: 'load',
            handler: function (fileItem, e) {

                var data = {
                    responseText: fileItem.xhr.responseText
                };

                var chunkInfo = fileItem.chunk;
                if (chunkInfo) {
                    var fileSize = fileItem.file.size;
                    if (chunkInfo.uploaded < fileSize) {
                        // 分片上传成功
                        data.fileItem = fileItem.toPlainObject();
                        var event = fileItem.emit('chunkuploadsuccess', data);
                        if (!event.isDefaultPrevented()) {
                            chunkInfo.index++;
                            chunkInfo.uploaded += chunkInfo.uploading;
                            if (chunkInfo.uploaded < fileSize) {
                                fileItem.upload();
                                return;
                            }
                        }
                    }
                }

                fileItem.status = AjaxUploader.STATUS_UPLOAD_SUCCESS;

                data.fileItem = fileItem.toPlainObject();
                fileItem.emit('uploadsuccess', data);

                uploadComplete(fileItem);

            }
        },

        uploadError: {
            type: 'error',
            handler: function (fileItem, e, errorCode) {

                fileItem.status = AjaxUploader.STATUS_UPLOAD_ERROR;

                fileItem.emit(
                    'uploaderror',
                    {
                        fileItem: fileItem.toPlainObject(),
                        errorCode: errorCode
                    }
                );

                uploadComplete(fileItem);
            }
        },

        uploadStop: {
            type: 'abort',
            handler: function (fileItem, e) {
                xhrEventHandler
                .uploadError
                .handler(fileItem, e, AjaxUploader.ERROR_CANCEL);
            }
        }
    };

    var uploadEventHandler = {

        uploadProgress: {
            type: 'progress',
            handler: function (fileItem, e) {

                var total = fileItem.file.size;
                var uploaded = e.loaded;

                var chunkInfo = fileItem.chunk;
                if (chunkInfo) {
                    uploaded += chunkInfo.uploaded;
                }

                fileItem.emit(
                    'uploadprogress',
                    {
                        fileItem: fileItem.toPlainObject(),
                        uploaded: uploaded,
                        total: total,
                        percent: (100 * restrain(getRatio(uploaded, total), 0, 1)).toFixed(2) + '%'
                    }
                );

            }
        }


    };

    /**
     * 上传完成后执行
     *
     * @inner
     * @param {Object} fileItem
     */
    function uploadComplete(fileItem) {

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

        var options = fileItem.options;
        if (options) {
            delete fileItem.options;
        }

        fileItem.emit(
            'uploadcomplete',
            {
                fileItem: fileItem.toPlainObject()
            }
        );

        fileItem.off();

    }

    function FileItem(options) {
        var me = this;
        $.extend(me, options);
        if (me.file == null) {
            me.file = formatFile(me.nativeFile)
        }
        if (me.status == null) {
            me.status = AjaxUploader.STATUS_WAITING;
        }
    }

    var FileItemPrototype = FileItem.prototype;

    FileItemPrototype.upload = function (options) {

        var me = this;

        if (!options) {
            options = me.options;
        }
        else {
            me.options = options;
        }

        var validStatus = options.useChunk
            ? AjaxUploader.STATUS_UPLOADING
            : AjaxUploader.STATUS_WAITING;

        if (me.status > validStatus) {
            return;
        }

        var xhr = new XMLHttpRequest();
        me.xhr = xhr;

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

        xhr.open('post', options.action, true);

        // 上传可能是同步的，因此这里强制异步
        nextTick(function () {
            if (options.useChunk) {
                me.uploadFileChunk(options);
            }
            else {
                me.uploadFile(options);
            }
        });

        return true;

    };

    FileItemPrototype.uploadFile = function (options) {

        var me = this;
        var formData = new FormData();

        if (options.data) {
            $.each(
                options.data,
                function (key, value) {
                    formData.append(key, value);
                }
            );
        }

        formData.append(
            options.fileName,
            me.nativeFile
        );

        var xhr = me.xhr;
        if (options.header) {
            $.each(options.header, function (name, value) {
                xhr.setRequestHeader(name, value);
            });
        }

        xhr.send(formData);

    };

    FileItemPrototype.uploadFileChunk = function (options) {

        var me = this;

        var file = me.nativeFile;

        // 碰到过传了几个分片之后，file.size 变成 0 的情况
        // 因此 fileSize 从最初的格式化对象中取比较保险
        var fileSize = me.file.size;

        var chunkInfo = me.chunk;
        if (!chunkInfo) {
            chunkInfo =
            me.chunk = {
                index: 0,
                uploaded: 0
            };
        }

        var chunkIndex = chunkInfo.index;

        var chunkSize = options.chunkSize;
        var start = chunkSize * chunkIndex;
        var end = chunkSize * (chunkIndex + 1);
        if (end > fileSize) {
            end = fileSize;
        }

        // 正在上传分片的大小
        chunkInfo.uploading = end - start;
        if (chunkInfo.uploading <= 0) {
            nextTick(
                function () {
                    xhrEventHandler
                    .uploadError
                    .handler(me, {}, AjaxUploader.ERROR_CHUNK_SIZE);
                }
            );
            return;
        }


        var xhr = me.xhr;

        var header = {
            'Content-Type': '',
            'X_FILENAME': encodeURIComponent(file.name),
            'Content-Range': 'bytes ' + (start + 1) + '-' + end + '/' + fileSize
        };

        if (options.header) {
            $.extend(header, options.header);
        }

        $.each(header, function (name, value) {
            xhr.setRequestHeader(name, value);
        });

        xhr.send(file.slice(start, end));

    };

    FileItemPrototype.cancel = function () {
        var me = this;
        if (me.status === AjaxUploader.STATUS_UPLOADING) {
            me.xhr.abort();
        }
    };

    FileItemPrototype.toPlainObject = function () {
        var me = this;
        var data = {
            index: me.index,
            file: me.file,
            nativeFile: me.nativeFile,
            status: me.status
        };
        if (me.chunk) {
            data.chunk = me.chunk;
        }
        return data;
    };

    FileItemPrototype.dispose = function () {
        var me = this;
        me.cancel();
        me.off();
    };

    eventUtil.extend(FileItemPrototype);

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
