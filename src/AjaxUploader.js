/**
 * @file AjaxUploader
 * @example
 *
 * var instance = new AjaxUploader({
 *     element: element,
 *     action: '/upload.php',
 *     accept: ['jpg', 'png'],
 *     multiple: true,
 *     data: { },
 *     onFileChange: fn,
 *     onUploadStart: fn,
 *     onUploadSuccess: fn,
 *     onUploadError: fn,
 *     onUploadStop: fn,
 *     onUploadComplete: fn
 * });
 * instance.upload();
 * instance.dispose();
 *
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

    /**
     * 使用 HTML5 ajax 上传
     *
     * @constructor
     * @param {Object} options
     * @param {jQuery} options.element 点击打开文件选择框的元素
     * @param {string} options.action 上传地址
     * @param {boolean=} options.multiple 是否支持多文件上传
     * @param {Object=} options.data 上传的其他数据
     * @param {string=} options.fileName 上传文件的 name 值，默认是 Filedata
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
    function AjaxUploader(options) {
        $.extend(this, AjaxUploader.defaultOptions, options);
        this.init();
    }


    AjaxUploader.prototype = {

        constructor: AjaxUploader,

        /**
         * 初始化元素和事件
         */
        init: function () {

            /**
             * 文件队列，格式如下：
             * {
             *     index: 0,  // 当前上传文件的索引
             *     files: [], // 上传文件列表
             * }
             *
             * @type {Object}
             */
            this.fileQueue = { };

            var element = this.element;

            // 确保是文件上传控件
            if (!element.is(':file')) {
                var input = $('<input type="file" />');
                element.replaceWith(input);
                element = this.element = input;
            }

            // 完善元素属性
            var properties = { };

            if (this.accept) {
                properties.accept = formatAccept(this.accept);
            }

            if (this.multiple) {
                properties.multiple = 'multiple';
            }

            for (var name in properties) {
                element.prop(name, properties[name]);
            }

            var me = this;
            var event = eventHandler.fileChange;
            element.on(event.type, function (e) {
                event.handler(me, e);
            });
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
         * 上传文件
         */
        upload: function () {

            disposeXHR(this);

            var file = getCurrentFile(this);
            if (!file || file.status !== AjaxUploader.STATUS_WAITING) {
                return;
            }

            var formData = new FormData();

            formData.append(
                this.fileName,
                file.nativeFile
            );

            var data = this.data;
            if (data) {
                for (var key in data) {
                    formData.append(key, data[key]);
                }
            }

            var xhr = createXHR(this);
            this.fileQueue.xhr = xhr;

            xhr.send(formData);
        },

        /**
         * 停止上传
         */
        stop: function () {
            var file = getCurrentFile(this);
            if (file && file.status === AjaxUploader.STATUS_UPLOADING) {
                var xhr = this.fileQueue.xhr;
                if (xhr) {
                    xhr.abort();
                }
            }
        },

        /**
         * 启用
         */
        enable: function () {
            this.element.removeProp('disabled');
        },

        /**
         * 禁用
         */
        disable: function () {
            this.element.prop('disabled', 'disabled');
        },

        /**
         * 销毁对象
         */
        dispose: function () {
            this.stop();
            disposeXHR(this);
            this.element.off();

            this.element =
            this.fileQueue = null;
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    AjaxUploader.defaultOptions = {
        multiple: false,
        fileName: 'Filedata',
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
     * 上传出现沙箱安全错误
     *
     * @const
     * @type {number}
     */
    AjaxUploader.ERROR_SECURITY = 1;

    /**
     * 上传 IO 错误
     *
     * @const
     * @type {number}
     */
    AjaxUploader.ERROR_IO = 2;

    /**
     * ext -> mimeType
     *
     * @private
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

        jar     : 'application/java-archive',
        war     : 'application/java-archive',
        ear     : 'application/java-archive',
        hqx     : 'application/mac-binhex40',
        doc     : 'application/msword',
        pdf     : 'application/pdf',
        ps      : 'application/postscript',
        eps     : 'application/postscript',
        ai      : 'application/postscript',
        rtf     : 'application/rtf',
        xls     : 'application/vnd.ms-excel',
        ppt     : 'application/vnd.ms-powerpoint',
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
        docx    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls     : 'application/vnd.ms-excel',
        xlsx    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    };

    /**
     * 事件处理函数
     *
     * @private
     * @type {Object}
     */
    var eventHandler = {

        fileChange: {
            type: 'change',
            handler: function (uploader, e) {
                setFiles(uploader, uploader.element.prop('files'));
                if (typeof uploader.onFileChange === 'function') {
                    uploader.onFileChange();
                }
            }
        },

        uploadStart: {
            type: 'loadstart',
            handler: function (uploader, e) {

                var file = getCurrentFile(uploader);
                file.status = AjaxUploader.STATUS_UPLOADING;

                if (typeof uploader.onUploadStart === 'function') {
                    uploader.onUploadStart({
                        fileItem: file
                    });
                }
            }
        },

        uploadProgress: {
            type: 'progress',
            handler: function (uploader, e) {
                if (typeof uploader.onUploadProgress === 'function') {
                    uploader.onUploadProgress({
                        fileItem: getCurrentFile(uploader),
                        uploaded: e.loaded,
                        total: e.total
                    });
                }
            }
        },

        uploadSuccess: {
            type: 'load',
            handler: function (uploader, e) {

                var file = getCurrentFile(uploader);
                file.status = AjaxUploader.STATUS_UPLOAD_SUCCESS;

                if (typeof uploader.onUploadSuccess === 'function') {
                    uploader.onUploadSuccess({
                        fileItem: file,
                        responseText: e.target.responseText
                    });
                }

                if (typeof uploader.onUploadComplete === 'function') {
                    uploader.onUploadComplete({
                        fileItem: file
                    });
                }

                uploader.fileQueue.index = file.index + 1;
                uploader.upload();
            }
        },

        uploadError: {
            type: 'error',
            handler: function (uploader, e, errorCode) {

                var file = getCurrentFile(uploader);
                file.status = AjaxUploader.STATUS_UPLOAD_ERROR;

                if (typeof uploader.onUploadError === 'function') {
                    uploader.onUploadError({
                        fileItem: file,
                        errorCode: errorCode
                    });
                }
                if (typeof uploader.onUploadComplete === 'function') {
                    uploader.onUploadComplete({
                        fileItem: file
                    });
                }
            }
        },

        uploadStop: {
            type: 'abort',
            handler: function (uploader, e) {
                eventHandler.uploadError.handler(uploader, e, AjaxUploader.ERROR_CANCEL);
            }
        }
    };

    /**
     * xhr 对象需要监听的事件
     *
     * @private
     * @type {Array.<string>}
     */
    var xhrEvents = [ 'uploadSuccess', 'uploadError', 'uploadStop' ];

    /**
     * xhr.upload 对象需要监听的事件
     *
     * @private
     * @type {Array.<string>}
     */
    var uploadEvents = [ 'uploadStart', 'uploadProgress' ];

    /**
     * 创建 XHR 对象
     *
     * @private
     * @param {AjaxUploader} uploader
     * @return {XMLHttpRequest}
     */
    function createXHR(uploader) {
        var xhr = new XMLHttpRequest();
        var upload = xhr.upload;

        $.each(xhrEvents, function (index, name) {
            var item = eventHandler[name];
            xhr['on' + item.type] = function (e) {
                item.handler(uploader, e);
            };
        });
        $.each(uploadEvents, function (index, name) {
            var item = eventHandler[name];
            upload['on' + item.type] = function (e) {
                item.handler(uploader, e);
            };
        });

        xhr.open('POST', uploader.action, true);

        return xhr;
    }

    /**
     * 销毁 XHR 对象
     *
     * @private
     * @param {AjaxUploader} uploader
     */
    function disposeXHR(uploader) {
        var xhr = uploader.fileQueue.xhr;
        if (xhr) {

            var upload = xhr.upload;
            $.each(xhrEvents, function (index, name) {
                xhr['on' + eventHandler[name].type] = null;
            });
            $.each(uploadEvents, function (index, name) {
                upload['on' + eventHandler[name].type] = null;
            });

            delete uploader.fileQueue.xhr;
        }
    }

    /**
     * 设置选择的文件
     *
     * @private
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
     * @private
     * @param {AjaxUploader} uploader
     * @return {?Object}
     */
    function getCurrentFile(uploader) {
        var fileQueue = uploader.fileQueue;
        var index = fileQueue.index;
        if (fileQueue.files && typeof index === 'number') {
            return fileQueue.files[index];
        }
    }

    /**
     * 把 [ 'jpg', 'png' ] 格式的 accept 转为
     * 浏览器可识别的 'image/jpg,image/png'
     *
     * @private
     * @param {Array.<string>} accept
     * @return {string}
     */
    function formatAccept(accept) {
        var result = [ ];
        $.each(accept, function (index, name) {
            if (ext2MimeType[name]) {
                result.push(ext2MimeType[name]);
            }
        });
        return result.join(',');
    }

    /**
     * 把 File 对象统一为简单对象格式
     *
     * @private
     * @param {File} file
     * @return {Object}
     */
    function formatFile(file) {
        var name = file.name;
        var segments = name.split('.');
        var type = segments.length > 0
                 ? segments.pop().toLowerCase()
                 : '';

        return {
            name: name,
            type: type,
            size: file.size
        };
    }


    return AjaxUploader;

});
