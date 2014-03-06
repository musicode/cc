/**
 * @file 简单的 flash 上传实现(simple upload....)
 * @author zhujl
 */
define(function (require, exports, module) {

    if (window.Supload === Supload) {
        return window.Supload;
    }

    /**
     * Supload 构造函数
     *
     * @constructor
     * @param {Object} options
     * @param {HTMLElement|string} options.element 放置 <oject> 标签的元素或元素 ID
     * @param {string} options.flashUrl swf 文件所在地址
     * @param {string} options.action 上传地址
     * @param {string=} options.fileName 文件的 name
     * @param {string=} options.accept 可上传的文件格式，如 'jpg,png'
     * @param {boolean=} options.multiple 是否支持多文件上传
     * @param {Object=} options.data 上传的其他数据
     * @param {Function=} options.onLoaded
     * @param {Function=} options.onFileChange
     * @param {function(Object)=} options.onUploadStart
     * @param {function(Object)=} options.onUploadProgress
     * @param {function(Object)=} options.onUploadSuccess
     * @param {function(Object)=} options.onUploadError
     * @param {function(Object)=} options.onUploadComplete
     */
    function Supload(options) {
        for (var key in options) {
            if (options.hasOwnProperty(key)) {
                this[key] = options[key];
            }
        }
        this.projectName = 'Supload';
        this.init();
    }

    Supload.prototype = {

        constructor: Supload,

        /**
         * 初始化
         */
        init: function () {
            this.movieName = createGuid();
            if (typeof this.element === 'string') {
                this.element = document.getElementById(this.element);
            }

            var data = this.data || (this.data = { });
            var cookie = getCookie();

            for (var key in cookie) {
                if (typeof data[key] === 'undefined') {
                    data[key] = cookie[key];
                }
            }

            // 替换元素
            var swf = createSWF(this.movieName, this.flashUrl, this.getFlashVars());
            this.element.parentNode.replaceChild(swf, this.element);
            this.element = swf;

            Supload.instances[this.movieName] = this;
        },

        /**
         * 拼装给 flash 用的参数
         *
         * @return {string}
         */
        getFlashVars: function () {
            var paramKeys = [ 'projectName', 'movieName', 'action', 'accept', 'multiple', 'fileName', 'data' ];
            var result = [ ];

            for (var i = 0, len = paramKeys.length, key; i < len; i++) {
                key = paramKeys[i];
                if (this[key] != null) {
                    result.push(key + '=' + encodeURIComponent(this[key]));
                }
            }

            return result.join('&amp;');
        },

        /**
         * 获得要上传的文件
         *
         * @return {Array}
         */
        getFiles: function () {
            return (this.element.getFiles && this.element.getFiles()) || [ ];
        },

        /**
         * 上传
         */
        upload: function () {
            this.element.upload && this.element.upload();
        },

        /**
         * 取消上传
         */
        cancel: function () {
            this.element.cancel && this.element.cancel();
        },

        /**
         * 启用鼠标点击打开文件选择窗口
         */
        enable: function () {
            this.element.enable && this.element.enable();
        },

        /**
         * 禁用鼠标点击打开文件选择窗口
         */
        disable: function () {
            this.element.disable && this.element.disable();
        },

        /**
         * 销毁对象
         */
        dispose: function () {
            this.element.dispose && this.element.dispose();
            Supload.instances[this.movieName] = null;
        }
    };

    /**
     * Supload 实例容器
     *
     * @type {Object}
     */
    Supload.instances = { };

    /**
     * 等待上传状态
     *
     * @type {number}
     */
    Supload.STATUS_WAITING = 0;

    /**
     * 正在上传状态
     *
     * @type {number}
     */
    Supload.STATUS_UPLOADING = 1;

    /**
     * 上传成功状态
     *
     * @type {number}
     */
    Supload.STATUS_UPLOAD_SUCCESS = 2;

    /**
     * 上传失败状态
     *
     * @type {number}
     */
    Supload.STATUS_UPLOAD_ERROR = 3;

    /**
     * 上传中止错误
     *
     * @const
     * @type {number}
     */
    Supload.ERROR_CANCEL = 0;

    /**
     * 上传出现沙箱安全错误
     *
     * @const
     * @type {number}
     */
    Supload.ERROR_SECURITY = 1;

    /**
     * 上传 IO 错误
     *
     * @const
     * @type {number}
     */
    Supload.ERROR_IO = 2;

    /**
     * guid 初始值
     *
     * @private
     * @type {number}
     */
    var guidIndex = 0x2B845;

    /**
     * 创建新的唯一的 guid
     *
     * @private
     * @return {string}
     */
    function createGuid() {
        return '_Supload_' + (guidIndex++);
    }

    /**
     * 创建 swf 元素
     *
     * @private
     * @param {string} id 元素 id，IE 必须要这个
     * @param {string} flashUrl swf 文件地址
     * @param {string} flashVars 传给 flash 的变量
     * @return {HTMLElement}
     */
    function createSWF(id, flashUrl, flashVars) {

        var html = '<object id="' + id + '" data="' + flashUrl + '" type="application/x-shockwave-flash">'
                 +     '<param name="wmode" value="transparent">'
                 +     '<param name="allowscriptaccess" value="always">'
                 +     '<param name="movie" value="' + flashUrl + '" />'
                 +     '<param name="flashvars" value="' + flashVars + '"/>'
                 + '</object>';

        var div = document.createElement('div');
        div.innerHTML = html;
        return div.firstChild;
    }

    /**
     * 获得 cookie 的 Object 格式
     *
     * @private
     * @return {Object}
     */
    function getCookie() {
        var cookie = document.cookie

        if (cookie.indexOf('"') === 0) {
            // This is a quoted cookie as according to RFC2068, unescape...
            cookie = cookie.slice(1, -1)
                           .replace(/\\"/g, '"')
                           .replace(/\\\\/g, '\\');
        }

        var result = { };

        try {

            // Replace server-side written pluses with spaces.
            // If we can't decode the cookie, ignore it, it's unusable.
            // If we can't parse the cookie, ignore it, it's unusable.
            cookie = decodeURIComponent(cookie.replace(/\+/g, ' '));

            var parts = cookie.split(';');
            for (var i = parts.length - 1; i >= 0; i--) {
                var pair = parts[i].split('=');
                result[trim(pair[0])] = trim(pair[1]);
            }
        }
        catch (e) { };

        return result;
    }

    // 实现一个简单的 trim 函数
    var trim;

    if (typeof String.prototype.trim === 'function') {
        trim = function (str) {
            return str.trim();
        };
    }
    else {
        trim = function (str) {
            return str.replace(/^\s+|\s+$/g, '');
        };
    }

    /**
     * 暴露给全局的对象，这样 as 才能调到
     *
     * @type {Function}
     */
    window.Supload = Supload;

    return Supload;

});
