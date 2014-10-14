/**
 * @file 表单验证器
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var lifeCycle = require('../function/lifeCycle');

    /**
     * 表单验证通常包括 required, min, max 等
     * 为方便记忆，属性名称遵循 HTML5 标准，具体可参考 html5 input 元素属性
     *
     *  required: 是否必填
     *       max: 数字最大值
     *       min: 数字最小值
     *      step: 数字步进值
     * maxlength: 字符串最大长度
     * minlength: 字符串最小长度
     *   pattern: 正则
     *
     *
     */

    /**
     * 表单验证器
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 表单元素
     * @property {boolean=} options.realtime 是否实时验证，默认为 true
     * @property {string=} options.requiredClass 不满足 required 要求的 className，
     *                                           required 不同于一般的 error，最好区别对待
     *
     * @property {boolean} options.groupSelector className 作用于哪个元素，不传表示当前字段元素，
     *                                           传了则用 field.closest(selector) 进行向上查找
     * @property {string=} options.successClass 验证通过的 className
     * @property {string=} options.errorClass 验证失败的 className
     * @property {string=} options.errorSelector 显示错误文本的元素选择器，如 .error
     * @property {Object=} options.errorText 配置错误文本，如下
     *                                       {
     *                                           username: {
     *                                              required: '请输入用户名'
     *                                           }
     *                                       }
     * @property {Object=} options.extension 扩展验证，比如跟业务紧密相关的验证，如下
     *                                       {
     *                                           password_confirm: function () {
     *                                               return 'passwordDifferent'
     *                                           }
     *                                       }
     * @property {Function=} options.onSuccess 验证成功时调用
     * @property {Function=} options.onError 验证失败时调用
     * @argument {Array.<jQuery>} options.onError.fields 验证失败的表单字段
     */
    function Validator(options) {
        return lifeCycle.init(this, options);
    }

    Validator.prototype = {

        constructor: Validator,

        type: 'Validator',

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;

            // 禁用原生表单验证
            var form = element.prop('tagName') === 'FORM'
                     ? element
                     : element.find('form');

            if (form.length > 0) {
                form.attr('novalidate', 'novalidate');
            }

            var groupSelector = me.groupSelector;
            var focusType = 'focusin' + namespace;
            var focusHandler = function (e) {
                $(e.currentTarget)
                .closest(groupSelector)
                .removeClass(me.successClass)
                .removeClass(me.errorClass);
            };

            element
            .on(focusType, 'input', focusHandler)
            .on(focusType, 'select', focusHandler)
            .on(focusType, 'textarea', focusHandler);

            if (me.realtime) {

                var blurType = 'focusout' + namespace;
                var blurHandler = function (e) {
                    validateGroup(me, $(this).closest(groupSelector));
                };

                element
                .on(blurType, 'input', blurHandler)
                .on(blurType, 'select', blurHandler)
                .on(blurType, 'textarea', blurHandler);
            }

            element.on(
                'submit' + namespace,
                $.proxy(me.validate, me)
            );

        },

        /**
         * 验证表单的所有字段
         *
         * @param {(Array.<string>|string)=} fields 可选，验证一个或多个字段
         *                                          如 ['username', 'password']
         *                                          默认验证所有字段
         *
         * @return {boolean} 是否验证成功
         */
        validate: function (fields) {

            var me = this;
            var element = me.element;
            var groupSelector = me.groupSelector;

            var result = true;
            var groups;

            if ($.type(fields) === 'string') {
                fields = [ fields ];
            }

            if ($.isArray(fields)) {
                groups = $.map(
                            fields,
                            function (name) {
                                return element
                                .find('[name="' + name + '"]')
                                .closest(groupSelector);
                            }
                        );
            }
            else {
                groups = element.find(groupSelector);
            }

            // 按组验证，每组里面只要有一个错了就算整组错了
            $.each(
                groups,
                function (index, group) {

                    group = $(group);

                    if (group.css('display') !== 'none') {
                        if ($.type(validateGroup(me, group)) === 'string') {
                            result = false;
                        }
                    }
                }
            );

            return result;

        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.element.off(namespace);
            me.element = null;
        }

    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Validator.defaultOptions = {
        realtime: false,
        groupSelector: '.form-group',
        successClass: 'has-success',
        errorClass: 'has-error',
        errorSelector: '.error',
        errorTemplate: '<i class="icon icon-times-circle"></i>&nbsp;${text}',
        renderTemplate: function (tpl, data) {
            return tpl.replace(/\${(\w+)}/g, function ($0, $1) {
                return data[$1] || '';
            });
        },
        errorPosition: function (field, error) {

            if (field.prop('type') === 'hidden') {
                field = field.parent();
            }

            // 把 position 清空才能取到正确的宽度
            error.css({
                position: 'static',
                width: 'auto'
            });

            var position = field.position();

            error.css({
                position: 'absolute',
                left: position.left + field.outerWidth() - 35,
                top: position.top - error.outerHeight() + 10,
                // FF 计算有点问题，加 5 比较保险不会换行
                width: error.width() + 5
            });

        }
    };

    /**
     * 配置验证类型
     *
     * key 是 <input type="" /> 中的 type
     *
     * 可扩展，比如想设计用户名规则，可添加
     *
     * Validator.type.username = [ ]
     *
     * @static
     * @type {Object}
     */
    Validator.type = {

        text: [ 'required', 'pattern', 'min', 'max', 'minlength', 'maxlength' ],

        hidden: [ 'required' ],

        password: [ 'required', 'pattern', 'minlength', 'maxlength', 'equals' ],

        number: [ 'required', 'pattern', 'min', 'max', 'step' ],

        range: [ 'required', 'pattern', 'min', 'max', 'step' ],

        tel: [ 'required', 'pattern' ],

        url: [ 'required', 'pattern' ],

        email: [ 'required', 'pattern' ],

        // 下面是扩展

        mobile: [ 'required', 'pattern' ],

        money: [ 'required', 'pattern', 'min', 'max' ],

        idcard: [ 'required', 'pattern' ]

    };

    /**
     * 配置属性验证
     *
     * @static
     * @type {Object}
     */
    Validator.attr = {

        required: function (field) {
            if ($.trim(field.val()).length > 0) {
                return true;
            }
            else if (field.attr('required') === 'required') {
                return false;
            }
        },

        pattern: function (field) {

            var pattern = field.attr('pattern')
                        || Validator.pattern[field.attr('type')];

            if ($.type(pattern) === 'string') {
                pattern = new RegExp(pattern);
            }

            if (pattern) {
                return pattern.test($.trim(field.val()));
            }
        },

        minlength: function (field) {
            var len = field.attr('minlength');
            if ($.isNumeric(len)) {
                return $.trim(field.val()).length >= + len;
            }
        },

        maxlength: function (field) {
            var len = field.attr('maxlength');
            if ($.isNumeric(len)) {
                return $.trim(field.val()).length <= + len;
            }
        },

        min: function (field) {
            var min = field.attr('min');
            if ($.isNumeric(min)) {
                // min 转成数字进行比较
                return $.trim(field.val()) >= + min;
            }
        },

        max: function (field) {
            var max = field.attr('max');
            if ($.isNumeric(max)) {
                // max 转成数字进行比较
                return $.trim(field.val()) <= + max;
            }
        },

        step: function (field) {
            var min = field.attr('min') || 1;
            var step = field.attr('step');
            if ($.isNumeric(step)) {
                return ($.trim(field.val()) - min) % step === 0;
            }
        },

        /**
         * 是否和另一个字段相同，确认密码常用，如
         * <input type="password" name="password" required />
         * <input type="password" name="password_confirm" equals="password" />
         *
         * @param {jQuery} field 字段元素
         * @param {jQuery} form 表单元素
         * @return {?boolean}
         */
        equals: function (field, form) {
            var equals = field.attr('equals');
            if (equals) {
                return $.trim(field.val()) === $.trim(form.find('[name="' + equals + '"]').val());
            }
        }

    };

    /**
     * 配置 type 对应的正则
     *
     * @static
     * @type {Object}
     */
    Validator.pattern = {
        number: /^[\d.]*$/,
        url: /^(?:(?:0\d{2,3}[- ]?[1-9]\d{6,7})|(?:[48]00[- ]?[1-9]\d{6}))$/,
        tel: /^(?:(?:0\d{2,3}[- ]?[1-9]\d{6,7})|(?:[48]00[- ]?[1-9]\d{6}))$/,
        mobile: /^1[3-9]\d{9}$/,
        email: /^(?:[a-z0-9]+[_\-+.]+)*[a-z0-9]+@(?:([a-z0-9]+-?)*[a-z0-9]+.)+([a-z]{2,})+$/i,
        money: /^[\d.]*$/,
        idcard: /(^\d{15}$)|(^\d{17}([0-9]|X)$)/i
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_form_validator';

    /**
     * 验证表单组，只要组内有一个字段错了就算整组错了
     *
     * @inner
     * @param {Validator} validator 验证器实例
     * @param {jQuery} group 表单组元素
     * @return {boolean|string} 正确时返回 true，错误时返回错误属性名称
     */
    function validateGroup(validator, group) {

        var errorField;
        var errorName;
        var errorAttr;

        group
        .find('[name]')
        .each(function () {

            errorField = $(this);
            var result = validateField(validator, errorField);

            if ($.type(result) === 'string') {
                errorName = this.name;
                errorAttr = result;
                return false;
            }
        });

        var successClass = validator.successClass;
        var errorClass = validator.errorClass;

        if (errorAttr) {

            group
            .removeClass(successClass)
            .addClass(errorClass);

            var errorSelector = validator.errorSelector;
            if (errorSelector) {

                var errorElement = group.find(errorSelector);
                var errorText = validator.errorText[errorName];
                if (errorText) {
                    errorText = errorText[errorAttr];
                }

                if (errorText) {
                    var errorTemplate = validator.errorTemplate;
                    if (errorTemplate) {
                        errorText = validator.renderTemplate(
                                        errorTemplate,
                                        {
                                            text: errorText
                                        }
                                    );
                    }
                    errorElement.html(errorText);
                }
                else {
                    throw new Error(errorName + ' 字段 ' + errorAttr + ' 类型错误信息未定义');
                }

                var errorPosition = validator.errorPosition;
                if ($.isFunction(errorPosition)) {
                    errorPosition(
                        errorField,
                        errorElement
                    );
                }
            }
        }
        else {
            group
            .removeClass(errorClass)
            .addClass(successClass);
        }

        return errorAttr ? errorAttr : true;
    }

    /**
     * 验证表单字段
     *
     * @inner
     * @param {Validator} validator 验证器实例
     * @param {jQuery} field 表单字段元素
     * @return {boolean|string} 正确时返回 true，错误时返回错误属性名称
     */
    function validateField(validator, field) {

        var form = validator.element;

        // 这里不要用 field.prop，因为不合法的 type，浏览器会纠正为 text
        var type = field.attr('type');
        var name = field.prop('name');
        var value = field.prop('value');

        // 验证失败的属性名称，如 required
        var errorAttr;

        $.each(
            Validator.type[type] || [ ],
            function (index, name) {

                if (field.prop('disabled')) {
                    return;
                }

                var result = Validator.attr[name](field, form);

                if ($.type(result) === 'boolean') {
                    if (result === false) {
                        errorAttr = name;
                        return false;
                    }
                }
                // 如果不是强制字段，为空时避免后续属性的检测
                else if (value === '' && name === 'required') {
                    return false;
                }

            }
        );

        if (!errorAttr) {
            var extension = validator.extension;
            if (extension && extension[name]) {
                errorAttr = extension[name](field);
            }
        }

        return errorAttr ? errorAttr : true;

    }

    return Validator;

});
