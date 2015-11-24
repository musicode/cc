/**
 * @file 表单验证器
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var isHidden = require('../function/isHidden');
    var nextTick = require('../function/nextTick');
    var debounce = require('../function/debounce');
    var lifeUtil = require('../util/life');
    var validator = require('../util/validator');

    /**
     * 表单验证通常包括 required, min, max 等
     * 为方便记忆，属性名称遵循 HTML5 标准，具体可参考 html5 input 元素属性
     *
     *  required: 是否必填（boolean）
     *       max: 数字最大值（number）
     *       min: 数字最小值（number）
     *      step: 数字步进值（number）
     * maxlength: 字符串最大长度（number）
     * minlength: 字符串最小长度（number）
     *   pattern: 正则（string|RegExp）
     *
     * ## 自定义错误
     *
     * util/validator 模块内置了一些常用的规则，比如上面列举的 html5 属性
     *
     * 如果需要自定义规则，需要以下两步：
     * 1. 为 rules 添加一个规则，value 是函数，函数细节请参考 util/validator 注释
     * 2. 为 errors 添加一个错误话术，value 是字符串
     *
     * ## 失焦验证
     *
     * 表单验证可通过 validateOnBlur 整体控制表单字段是否开启失焦验证，本着局部覆盖全局的原则，
     * fields 可为某个单独的字段设置 validateOnBlur
     *
     * {
     *     fields: {
     *         username: {
     *             // 可覆盖 options 中的全局 validateOnBlur
     *             validateOnBlur: false,
     *
     *             // 验证规则
     *             rules: {
     *                 required: true,
     *                 min: 3,
     *                 max: 10,
     *                 minlength: 3,
     *                 maxlength: 10,
     *                 pattern: 'number',
     *                 custom: function (data) {
      *                    var value = data.value;
      *                    ....
      *                    return true/false/Promise;
      *                }
     *             },
     *
     *             // 与 rules 一一对应的错误信息
     *             errors: {
     *                 required: '请输入用户名',
     *                 min: '最小为 3'，
     *                 ...,
     *                 custom: '自定义错误'
     *             }
     *
     *         }
     *     }
     * }
     *
     *
     */

    /**
     * 表单验证器
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 表单元素
     * @property {boolean=} options.validateOnBlur 是否实时验证（元素失焦验证），默认为 false
     *
     * @property {number=} options.scrollOffset 使用 autoScroll 时，为了避免顶部贴边，最好加上一些间距
     *
     * @property {string=} options.errorTemplate 错误模板
     * @property {string=} options.errorAttribute 找到错误对应的提示元素的属性，如 data-error-for
     *
     * @property {boolean} options.groupSelector 上面三个 className 作用于哪个元素，不传表示当前字段元素，
     *                                           传了则用 field.closest(selector) 进行向上查找
     * @property {Function=} options.showErrorAnimation
     * @property {Function=} options.hideErrorAnimation
     *
     * @property {Object=} options.fields 配置字段
     *
     * @property {Function} options.render
     *
     */
    function Validator(options) {
        lifeUtil.init(this, options);
    }

    var proto = Validator.prototype;

    proto.type = 'Validator';

    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');
        var namespace = me.namespace();

        mainElement.on(
            'focusin' + namespace,
            function (e) {

                var target = $(e.target);

                var groupElement = target.closest(
                    me.option('groupSelector')
                );
                if (groupElement.length === 1) {

                    var errorAttribute = me.option('errorAttribute');
                    var name = target.prop('name');

                    var errorElement = groupElement.find('[' + errorAttribute + '="' + name + '"]');
                    if (errorElement.length === 1) {
                        me.execute(
                            'hideErrorAnimation',
                            {
                                errorElement: errorElement,
                                fieldElement: target
                            }
                        );
                    }

                }

            }
        );

        mainElement.on(
            'focusout' + namespace,
            // 大多数场景下，不需要延迟执行
            // 对于输入框后面跟选择层的场景，点击选择层会导致输入框 blur，因此设置一个延时
            // 经测试，180ms 是一个最小可用延迟
            // 本着没必要配置就不配置的原则，这里直接写死
            debounce(
                function (e) {
                    var name = e.target.name;
                    if (name) {
                        var config = me.option('fields')[name];
                        if (config) {
                            var local = config.validateOnBlur;
                            var global = me.option('validateOnBlur');
                            if (local === true || local == null && global) {
                                me.validate(name);
                            }
                        }
                    }
                },
                180
            )
        );


        me.inner({
            main: mainElement
        });


    };

    /**
     * 验证表单的所有字段
     *
     * @param {(Array.<string>|string)=} fields 可选，验证一个或多个字段
     *                                          如 ['username', 'password']
     *                                          默认验证所有字段
     *
     * @param {boolean=} autoScroll 验证失败时，是否自动滚动到第一个错误项，当表单很长时，开启有利于提升体验
     *
     * @return {boolean|Promise} 是否验证成功
     */
    proto.validate = function (fields, autoScroll) {

        var me = this;

        var mainElement = me.option('mainElement');
        var groupSelector = me.option('groupSelector');

        if ($.type(fields) === 'string') {
            fields = [ fields ];
        }
        else if (!$.isArray(fields)) {

            if ($.type(fields) === 'boolean') {
                autoScroll = fields;
            }

            fields = [ ];

            $.each(
                me.option('fields'),
                function (name) {
                    fields.push(name);
                }
            );

        }

        var data = { };

        $.each(
            fields,
            function (index, name) {

                var fieldElement = mainElement.find('[name="' + name + '"]');
                if (!fieldElement.length || fieldElement.prop('disabled')) {
                    return;
                }

                var groupElement = fieldElement.closest(groupSelector);
                if (isHidden(groupElement)) {
                    return;
                }

                data[ name ] = {
                    name: name,
                    value: $.trim(fieldElement.val()),
                    fieldElement: fieldElement,
                    groupElement: groupElement
                };

            }
        );

        var result = validator.validate(data, me.option('fields'));
        var errors = [ ];

        var validateComplete = function () {

            var errorAttribute = me.option('errorAttribute');
            var errorTemplate = me.option('errorTemplate');

            $.each(
                result,
                function (index, item) {
                    var errorElement = item.groupElement.find('[' + errorAttribute + '=' + item.name + ']');
                    if (item.error) {

                        errors.push(item);

                        var html = me.execute(
                            'render',
                            [
                                {
                                    error: item.error
                                },
                                errorTemplate
                            ]
                        );

                        errorElement.html(html);

                        me.execute(
                            'showErrorAnimation',
                            {
                                errorElement: errorElement,
                                fieldElement: item.fieldElement
                            }
                        );
                    }
                    else {
                        me.execute(
                            'hideErrorAnimation',
                            {
                                errorElement: errorElement,
                                fieldElement: item.fieldElement
                            }
                        );
                    }
                }
            );

            if (autoScroll && errors.length > 0) {

                var fieldElement = errors[ 0 ].fieldElement;
                if (fieldElement.is(':hidden')) {
                    fieldElement = fieldElement.closest(':visible');
                }

                var top = fieldElement.offset().top;
                var scrollOffset = me.option('scrollOffset');

                if ($.type(scrollOffset) === 'number') {
                    top += scrollOffset;
                }

                window.scrollTo(
                    window.scrollX,
                    top
                );

            }

            nextTick(
                function () {
                    me.emit(
                        'validatecomplete',
                        {
                            fields: result,
                            errors: errors
                        }
                    );
                }
            );

        };

        if (result.then) {
            result.then(function (data) {
                result = data;
                validateComplete();
            });
        }
        else {
            validateComplete();
            return errors.length === 0;
        }

    };

    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.inner('main').off(
            me.namespace()
        );

    };

    lifeUtil.extend(proto);


    return Validator;

});
