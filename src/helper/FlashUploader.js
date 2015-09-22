/**
 * @file FlashUploader
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 如果出现 flash 跨域问题，有两种解决办法：
     *
     * 1. 可把 supload.swf 放到自己的域下，修改 FlashUploader.defaultOptions.flashUrl
     * 2. 放一个 crossdomain.xml 跨域配置文件
     *
     */


    require('../util/supload/supload');

    var Supload = window.Supload;

    var lifeCycle = require('../function/lifeCycle');
    var ucFirst = require('../function/ucFirst');
    var ratio = require('../function/ratio');

    /**
     * 使用 flash 上传
     *
     * 注意：不能 hide() 元素，否则 swf 会自动销毁
     *      不能 css('visibility', 'hidden') 元素，IE 下 swf 会自动销毁
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 点击打开文件选择框的元素
     * @property {string} options.action 上传地址
     * @property {boolean=} options.multiple 是否支持多文件上传
     * @property {Object=} options.data 上传的其他数据
     * @property {boolean=} options.ignoreError 多文件上传，当某个文件上传失败时，是否继续上传后面的文件，默认为 false
     * @property {Array.<string>=} options.accept 可上传的文件类型，如
     *                                            [ 'jpg', 'png' ]
     */
    function FlashUploader(options) {
        lifeCycle.init(this, options);
    }

    var proto = FlashUploader.prototype;

    proto.type = 'FlashUploader';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');

        var swfOptions = {
            element: mainElement[0],
            flashUrl: me.option('flashUrl'),
            action: me.option('action'),
            accept: me.option('accept'),
            multiple: me.option('multiple'),
            data: me.option('data'),
            fileName: me.option('fileName'),
            ignoreError: me.option('ignoreError'),
            customSettings: {
                uploader: me
            }
        };

        $.each(
            eventHandler,
            function (type, handler) {
                swfOptions[ 'on' + ucFirst(type) ] = handler;
            }
        );

        me.inner(
            'supload',
            new Supload(swfOptions)
        );

    };

    /**
     * 获取当前选择的文件
     *
     * @return {Array.<Object>}
     */
    proto.getFiles = function () {
        return this.inner('supload').getFiles();
    };

    /**
     * 设置上传地址
     *
     * @param {string} action
     */
    proto.setAction = function (action) {
        this.inner('supload').setAction(action);
    };

    /**
     * 设置上传数据
     *
     * @param {Object} data 需要一起上传的数据
     */
    proto.setData = function (data) {
        this.inner('supload').setData(data);
    };

    /**
     * 重置
     */
    proto.reset = function () {
        this.inner('supload').reset();
    };

    /**
     * 上传文件
     */
    proto.upload = function () {
        this.inner('supload').upload();
    };

    /**
     * 停止上传
     */
    proto.stop = function () {
        this.inner('supload').cancel();
    };

    /**
     * 启用
     */
    proto.enable = function () {
        this.inner('supload').enable();
    };

    /**
     * 禁用
     */
    proto.disable = function () {
        this.inner('supload').disable();
    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('supload').dispose();

    };

    lifeCycle.extend(proto);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    FlashUploader.defaultOptions = {
        multiple: false,
        fileName: 'Filedata',
        ignoreError: false,
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
     * @inner
     * @type {Object}
     */
    var eventHandler = {

        /**
         * flash 加载完成
         */
        ready: function () {
            var uploader = this.customSettings.uploader;
            uploader.emit('ready');
        },

        /**
         * 选择文件
         */
        fileChange: function () {
            var uploader = this.customSettings.uploader;
            uploader.emit('filechange');
        },

        /**
         * 开始上传
         *
         * @param {Object} data
         * @property {Object} data.fileItem
         */
        uploadStart: function (data) {
            var uploader = this.customSettings.uploader;
            uploader.emit('uploadstart', data);
        },

        /**
         * 正在上传
         *
         * @param {Object} data
         * @property {Object} data.fileItem
         * @property {number} data.uploaded
         * @property {number} data.total
         */
        uploadProgress: function (data) {

            var uploader = this.customSettings.uploader;

            data.percent = 100  * ratio(data.uploaded, data.total) + '%';

            uploader.emit('uploadprogress', data);

        },

        /**
         * 上传成功
         *
         * @param {Object} data
         * @property {Object} data.fileItem
         * @property {string} data.response
         */
        uploadSuccess: function (data) {
            var uploader = this.customSettings.uploader;
            uploader.emit('uploadsuccess', data);
        },

        /**
         * 上传失败，失败原因可查看 errorCode
         *
         * @param {Object} data
         * @property {Object} data.fileItem
         * @property {number} data.errorCode
         */
        uploadError: function (data) {
            var uploader = this.customSettings.uploader;
            uploader.emit('uploaderror', data);
        },

        /**
         * 上传完成，在 成功/失败 之后触发
         *
         * @param {Object} data
         * @property {Object} data.fileItem
         */
        uploadComplete: function (data) {
            var uploader = this.customSettings.uploader;
            uploader.emit('uploadcomplete', data);
        }
    };


    return FlashUploader;

});
