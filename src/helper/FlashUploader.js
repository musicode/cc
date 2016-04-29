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

    var ucFirst = require('../function/ucFirst');
    var getRatio = require('../function/ratio');

    var lifeUtil = require('../util/life');
    require('../util/supload/supload');

    var Supload = window.Supload;

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
     * @property {Object=} options.header 请求头
     * @property {Array.<string>=} options.accept 可上传的文件类型，如
     *                                            [ 'jpg', 'png' ]
     */
    function FlashUploader(options) {
        lifeUtil.init(this, options);
    }

    var proto = FlashUploader.prototype;

    proto.type = 'FlashUploader';

    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');

        var action = me.option('action');
        var data = me.option('data');

        var options = {
            element: mainElement[0],
            flashUrl: me.option('flashUrl'),
            action: data,
            accept: me.option('accept'),
            multiple: me.option('multiple'),
            data: data,
            header: me.option('header'),
            fileName: me.option('fileName'),
            customSettings: {
                uploader: me
            }
        };

        $.each(
            eventHandler,
            function (type, handler) {
                options[ 'on' + ucFirst(type) ] = handler;
            }
        );

        var supload = new Supload(options);
        me.inner({
            supload: supload,
            watchSync: {
                action: function (action) {
                    supload.setAction(action);
                },
                data: function (data) {
                    supload.setData(data);
                }
            }
        });

        me.set({
            action: action,
            data: data
        });

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
     * 重置
     */
    proto.reset = function () {
        this.inner('supload').reset();
    };

    /**
     * 上传文件
     */
    proto.upload = function (index) {
        this.inner('supload').upload(index);
    };

    /**
     * 停止上传
     */
    proto.stop = function (index) {
        this.inner('supload').cancel(index);
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

        lifeUtil.dispose(me);

        me.inner('supload').dispose();

    };

    lifeUtil.extend(proto, ['getFiles', 'setAction', 'setData']);

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

            data.percent = (100  * getRatio(data.uploaded, data.total)).toFixed(2) + '%';

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
