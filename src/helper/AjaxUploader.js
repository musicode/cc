/**
 * @file AjaxUploader
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * #多文件上传#
     *
     *     实质是文件多选，最终还是一个一个上传文件的，并非同时上传
     *
     * #文件格式#
     *
     *     html 的规范是 MIME type，如 audio/*, video/*
     *     具体可见 http://www.iana.org/assignments/media-types
     *
     *     但鉴于这种方式不直观(小白可能都没听过 MIME type)，还是用扩展名好了
     */

    'use strict';

    var lifeCycle = require('../function/lifeCycle');

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
     * @property {Function=} options.onFileChange
     * @property {Function(Object)=} options.onUploadStart
     * @property {Function(Object)=} options.onUploadProgress
     * @property {Function(Object)=} options.onUploadSuccess
     * @property {Function(Object)=} options.onChunkUploadSuccess
     * @property {Function(Object)=} options.onUploadError
     * @property {Function(Object)=} options.onUploadComplete
     */
    function AjaxUploader(options) {
        return lifeCycle.init(this, options);
    }

    AjaxUploader.prototype = {

        constructor: AjaxUploader,

        type: 'AjaxUploader',

        /**
         * 初始化元素和事件
         */
        init: function () {

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
                var input = $('<input type="file" />');
                element.replaceWith(input);
                element = me.element = input;
            }

            // 用一个 form 元素包着，便于重置
            var form = me.form = $('<form></form>');
            element.replaceWith(form);
            form.append(element);

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
                    if ($.isFunction(me.onFileChange)) {
                        me.onFileChange();
                    }
                }
            );
        },

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
        getFiles: function () {
            return this.fileQueue.files || [ ];
        },

        /**
         * 设置上传地址
         *
         * @param {string} action
         */
        setAction: function (action) {
            this.action = action;
        },

        /**
         * 设置上传数据
         *
         * @param {Object} data 需要一起上传的数据
         */
        setData: function (data) {
            $.extend(this.data, data);
        },

        /**
         * 重置
         */
        reset: function () {
            // 避免出现停止后选择相同文件，不触发 change 事件的问题
            this.form[0].reset();
        },

        /**
         * 上传文件
         */
        upload: function (fileItem) {

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

            if (me.useChunk) {
                uploadChunk(me, fileItem);
            }
            else {
                uploadFile(me, fileItem);
            }
        },

        /**
         * 停止上传
         */
        stop: function () {

            var me = this;
            var fileItem = getCurrentFileItem(me);
            if (fileItem && fileItem.status === AjaxUploader.STATUS_UPLOADING) {
                fileItem.xhr.abort();
            }

            me.reset();
        },

        /**
         * 启用
         */
        enable: function () {
            this.element.prop('disabled', false);
        },

        /**
         * 禁用
         */
        disable: function () {
            this.element.prop('disabled', true);
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.stop();
            me.element.off(namespace);

            me.element =
            me.fileQueue = null;

        }
    };

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
     * ext -> mimeType
     *
     * @inner
     * @type {Object}
     */
    var ext2MimeType = {
        html    : 'text/html',
        htm     : 'text/html',
        shtml   : 'text/html',
        xml     : 'text/xml',
        css     : 'text/css',
        js      : 'application/x-javascript',
        json    : 'application/json',
        atom    : 'application/atom+xml',
        rss     : 'application/rss+xml',

        mml     : 'text/mathml',
        txt     : 'text/plain',
        jad     : 'text/vnd.sun.j2me.app-descriptor',
        wml     : 'text/vnd.wap.wml',
        htc     : 'text/x-component',

        jpg     : 'image/jpeg',
        jpeg    : 'image/jpeg',
        png     : 'image/png',
        gif     : 'image/gif',
        tif     : 'image/tiff',
        tiff    : 'image/tiff',
        wbmp    : 'image/vnd.wap.wbmp',
        ico     : 'image/x-icon',
        jng     : 'image/x-jng',
        bmp     : 'image/x-ms-bmp',
        svg     : 'image/svg+xml',
        svgz    : 'image/svg+xml',
        webp    : 'image/webp',

        mp3     : 'audio/mpeg',
        wma     : 'audio/x-ms-wma',
        wav     : 'audio/x-wav',
        mid     : 'audio/midi',
        midd    : 'audio/midi',
        kar     : 'audio/midi',
        ogg     : 'audio/ogg',
        m4a     : 'audio/x-m4a',
        ra      : 'audio/x-realaudio',

        '3gp'   : 'video/3gpp',
        '3gpp'  : 'video/3gpp',
        mp4     : 'video/mp4',
        mpeg    : 'video/mpeg',
        mpg     : 'video/mpeg',
        mov     : 'video/quicktime',
        webm    : 'video/webm',
        flv     : 'video/x-flv',
        m4v     : 'video/x-m4v',
        mng     : 'video/x-mng',
        asx     : 'video/x-ms-asf',
        asf     : 'video/x-ms-asf',
        wmv     : 'video/x-ms-wmv',
        avi     : 'video/x-msvideo',
        rm      : 'video/vnd.rn-realvideo',
        rmvb    : 'video/vnd.rn-realvideo',

        jar     : 'application/java-archive',
        war     : 'application/java-archive',
        ear     : 'application/java-archive',
        hqx     : 'application/mac-binhex40',
        pdf     : 'application/pdf',
        ps      : 'application/postscript',
        eps     : 'application/postscript',
        ai      : 'application/postscript',
        rtf     : 'application/rtf',
        wmlc    : 'application/vnd.wap.wmlc',
        kml     : 'application/vnd.google-earth.kml+xml',
        kmz     : 'application/vnd.google-earth.kmz',
        '7z'    : 'application/x-7z-compressed',
        cco     : 'application/x-cocoa',
        jardiff : 'application/x-java-archive-diff',
        jnlp    : 'application/x-java-jnlp-file',
        run     : 'application/x-makeself',
        pl      : 'application/x-perl',
        pm      : 'application/x-perl',
        prc     : 'application/x-pilot',
        pdb     : 'application/x-pilot',
        rar     : 'application/x-rar-compressed',
        rpm     : 'application/x-redhat-package-manager',
        sea     : 'application/x-sea',
        swf     : 'application/x-shockwave-flash',
        sit     : 'application/x-stuffit',
        tcl     : 'application/x-tcl',
        tk      : 'application/x-tcl',
        der     : 'application/x-x509-ca-cert',
        pem     : 'application/x-x509-ca-cert',
        crt     : 'application/x-x509-ca-cert',
        xpi     : 'application/x-xpinstall',
        xhtml   : 'application/xhtml+xml',
        zip     : 'application/zip',

        bin     : 'application/octet-stream',
        exe     : 'application/octet-stream',
        dll     : 'application/octet-stream',
        deb     : 'application/octet-stream',
        dmg     : 'application/octet-stream',
        eot     : 'application/octet-stream',
        iso     : 'application/octet-stream',
        img     : 'application/octet-stream',
        msi     : 'application/octet-stream',
        msp     : 'application/octet-stream',
        msm     : 'application/octet-stream',

        doc     : 'application/msword',
        xls     : 'application/vnd.ms-excel',
        ppt     : 'application/vnd.ms-powerpoint',
        docx    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xlsx    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pptx    : 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };

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

                if ($.isFunction(uploader.onUploadStart)) {
                    uploader.onUploadStart({
                        fileItem: fileItem
                    });
                }
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
                        if ($.isFunction(uploader.onChunkUploadSuccess)) {
                            uploader.onChunkUploadSuccess(data);
                        }

                        chunkInfo.index++;
                        uploader.upload();

                        return;
                    }
                }

                fileItem.status = AjaxUploader.STATUS_UPLOAD_SUCCESS;

                if ($.isFunction(uploader.onUploadSuccess)) {
                    uploader.onUploadSuccess(data);
                }

                uploadComplete(uploader, fileItem);

            }
        },

        uploadError: {
            type: 'error',
            handler: function (uploader, e, errorCode) {

                var fileItem = getCurrentFileItem(uploader);
                fileItem.status = AjaxUploader.STATUS_UPLOAD_ERROR;

                if ($.isFunction(uploader.onUploadError)) {
                    uploader.onUploadError({
                        fileItem: fileItem,
                        errorCode: errorCode
                    });
                }

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
                if ($.isFunction(uploader.onUploadProgress)) {

                    var fileItem = getCurrentFileItem(uploader);

                    var total = fileItem.file.size;
                    var uploaded = e.loaded;

                    var chunkInfo = fileItem.chunk;
                    if (chunkInfo) {
                        uploaded += chunkInfo.uploaded;
                    }

                    var percent = uploaded / (total || 1);
                    percent = parseInt(100 * percent, 10) + '%';

                    uploader.onUploadProgress({
                        fileItem: fileItem,
                        uploaded: uploaded,
                        total: total,
                        percent: percent
                    });
                }
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

        if ($.isFunction(uploader.onUploadComplete)) {
            uploader.onUploadComplete({
                fileItem: fileItem
            });
        }

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

        return result.join(',');
    }

    /**
     * 把 File 对象统一为简单对象格式
     *
     * @inner
     * @param {File} file
     * @return {Object}
     */
    function formatFile(file) {

        var name = file.name;
        var parts = name.split('.');
        var type = parts.length > 0
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
