/**
 * @file 简单的 flash 上传实现(simple upload....)
 * @author musicode
 */
define(function (require, exports, module) {

    if (window.Supload === Supload) {
        return window.Supload;
    }

    var cookie = require('../cookie');
    var json = require('../json');

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
     * @param {Object=} options.header 请求头
     * @param {Function=} options.onLoaded
     * @param {Function=} options.onFileChange
     * @param {function(Object)=} options.onUploadStart
     * @param {function(Object)=} options.onUploadProgress
     * @param {function(Object)=} options.onUploadSuccess
     * @param {function(Object)=} options.onUploadError
     * @param {function(Object)=} options.onUploadComplete
     */
    function Supload(options) {
        $.extend(this, options);
        this.init();
    }

    Supload.prototype = {

        constructor: Supload,

        /**
         * 初始化
         */
        init: function () {

            var instanceId = createGuid();
            this.movieName = instanceId;

            var element = this.element;
            if ($.type(element) === 'string') {
                element = document.getElementById(element);
            }

            var data = this.data || (this.data = { });

            $.each(
                cookie.get(),
                function (key, value) {
                    if ($.type(data[key]) === 'undefined') {
                        data[key] = value;
                    }
                }
            );

            var swf = Supload.createSWF(instanceId, this.flashUrl, this.getFlashVars());
            element.parentNode.replaceChild(swf, element);
            this.element = swf;

//            this.onLog = function (data) {
//                console.log(data);
//            };

            Supload.instances[instanceId] = this;
        },

        /**
         * 拼装给 flash 用的参数
         *
         * @return {string}
         */
        getFlashVars: function () {

            var me = this;
            var result = [ ];

            $.each(
                [ 'movieName', 'action', 'accept', 'multiple', 'fileName', 'data', 'header' ],
                function (index, key) {
                    var value = me[key];
                    if (value != null) {
                        if ($.isPlainObject(value)) {
                            value = json.stringify(value);
                        }
                        else if ($.isArray(value)) {
                            value = value.join(',');
                        }
                        result.push(key + '=' + encodeURIComponent(value));
                    }
                }
            );

            result.push('projectName=' + Supload.projectName);

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
         * 设置上传地址
         *
         * @param {string} action
         */
        setAction: function (action) {
            this.element.setAction && this.element.setAction(action);
        },

        /**
         * 设置上传数据
         *
         * @param {Object} data 需要一起上传的数据
         */
        setData: function (data) {
            this.element.setData && this.element.setData(data);
        },

        /**
         * 重置
         */
        reset: function () {
            this.element.reset && this.element.reset();
        },

        /**
         * 上传
         */
        upload: function (index) {
            this.element.upload && this.element.upload(index);
        },

        /**
         * 取消上传
         */
        cancel: function (index) {
            this.element.cancel && this.element.cancel(index);
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
            // 清除 IE 引用
            window[this.movieName] = null;
        }
    };

    /**
     * 项目名称，as 会用 projectName.instances[movieName] 找出当前实例
     *
     * @type {string}
     */
    Supload.projectName = 'Supload';

    /**
     * 创建 swf 元素
     *
     * 无需兼容 IE67 用现有方法即可
     *
     * 如果想兼容 IE67，有两种方法：
     *
     * 1. 把 wmode 改成 opaque
     * 2. 用 swfobject 或别的库重写此方法
     *
     * 这里不兼容 IE67 是因为要判断浏览器实在太蛋疼了。。。
     *
     * @param {string} id 实例 id
     * @param {string} flashUrl swf 文件地址
     * @param {string} flashVars 传给 flash 的变量
     * @return {HTMLElement}
     */
    Supload.createSWF = function(id, flashUrl, flashVars) {

        // 不加 ID 在 IE 下没法运行
        var html = '<object id="' + id + '" class="' + Supload.projectName.toLowerCase()
                 + '" type="application/x-shockwave-flash" data="' + flashUrl + '">'
                 +     '<param name="movie" value="' + flashUrl + '" />'
                 +     '<param name="allowscriptaccess" value="always" />'
                 +     '<param name="wmode" value="transparent" />'
                 +     '<param name="flashvars" value="' + flashVars + '" />'
                 + '</object>';

        return $(html)[0];
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
     * @inner
     * @type {number}
     */
    var guidIndex = 0x2B845;

    /**
     * 创建新的唯一的 guid
     *
     * @inner
     * @return {string}
     */
    function createGuid() {
        return '_Supload_' + (guidIndex++);
    }

    /**
     * 暴露给全局的对象，这样 as 才能调到
     *
     * @type {Function}
     */
    window.Supload = Supload;


    return Supload;

});
