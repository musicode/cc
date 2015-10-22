/**
 * @file 验证器
 * @author musicode
 */
define(function (require, exports, module) {


    /**
     * 内置常用规则
     *
     * @inner
     * @type {Object}
     */
    var buildInRules = {

        required: function (data, rules) {
            if (data.value) {
                return true;
            }
            else if (data.rules.required) {
                return false;
            }
        },

        pattern: function (data) {
            var pattern = data.rules.pattern;
            if (pattern instanceof RegExp) {
                return pattern.test(data.value);
            }
        },

        minlength: function (data) {
            var minlength = data.rules.minlength;
            if ($.isNumeric(minlength)) {
                return data.value.length >= + minlength;
            }
        },

        maxlength: function (data) {
            var maxlength = data.rules.maxlength;
            if ($.isNumeric(maxlength)) {
                return data.value.length <= + maxlength;
            }
        },

        min: function (data) {
            var min = data.rules.min;
            if ($.isNumeric(min)) {
                return data.value >= + min;
            }
        },

        max: function (data) {
            var max = data.rules.max;
            if ($.isNumeric(max)) {
                return data.value <= + max;
            }
        },

        step: function (data) {
            var min = data.rules.min;
            var step = data.rules.step;
            if ($.isNumeric(min) && $.isNumeric(step)) {
                return (data.value - min) % step === 0;
            }
        },

        /**
         * 是否和另一个字段相同，确认密码常用，如
         * <input type="password" name="password" required />
         * <input type="password" name="password_confirm" equals="password" />
         *
         * @param {Object} data
         * @return {?boolean}
         */
        equals: function (data) {
            var equals = data.rules.equals;
            if (equals) {
                var target = this.inner('main').find('[name="' + equals + '"]');
                return data.value === $.trim(target.val());
            }
        }
    };

    /**
     * 内置常用正则
     *
     * @inner
     * @type {Object}
     */
    var buildInPatterns = {
        int: /^\d+$/,
        number: /^[\d.]*$/,
        char: /^[\w\u2E80-\u9FFF]+$/,
        url: /^(?:(?:0\d{2,3}[- ]?[1-9]\d{6,7})|(?:[48]00[- ]?[1-9]\d{6}))$/,
        tel: /^(?:(?:0\d{2,3}[- ]?[1-9]\d{6,7})|(?:[48]00[- ]?[1-9]\d{6}))$/,
        mobile: /^1[3-9]\d{9}$/,
        email: /^(?:[a-z0-9]+[_\-+.]+)*[a-z0-9]+@(?:([a-z0-9]+-?)*[a-z0-9]+.)+([a-z]{2,})+$/i
    };


    /**
     *
     * @param {Object} data 待验证的数据，格式如下：
     *                      {
     *                          key1: {
     *                              value1: '',
     *                              extra // 扩展数据，比如 DOM 元素
     *                          }
     *                      }
     *
     * @param {Object} rules 验证规则，格式如下：
     *                       {
     *                           key1: {
     *                               before: function () {
     *                                   // 返回 false 可拦截验证
     *                               },
     *                               after: function () {
     *
     *                               },
     *                               rules: {
     *                                   required: true,
     *                                   customRule1: function () {
     *                                      // 返回值：
     *                                      // true -> 验证通过
     *                                      // false -> 验证失败
     *                                      // promise -> 异步校验
     *                                      // 其他 -> 不做校验
     *                                   }
     *                               },
     *                               successes: {
     *
     *                               },
     *                               errors: {
     *                                   required: '请输入',
     *                                   customError1: '写错啦'
     *                               },
     *                           }
     *                       }
     */
    exports.validate = function (data, rules) {

        var result = [ ];

        var failRule;
        var failError;

        $.each(
            data,
            function (key, item) {

                $.each(
                    rules,
                    function (index, rule) {

                        var result = validateItem(item, rule);

                        if (result === false) {
                            failRule = rule;
                            return false;
                        }
                        // 如果不是强制字段，为空时避免后续属性的检测
                        else if (rule.name === 'required') {
                            if (item.value == null || item.value === '') {
                                return false;
                            }
                        }

                    }
                );

            }
        );


        if (failRule) {

            var errors = fieldConfig.errors;
            if (errors) {
                failError = errors[ failRule.name ];
            }

        }
        else if ($.isFunction(fieldConfig.custom)) {

            var deferred = $.Deferred();

            var customResult = me.execute(
                fieldConfig.custom,
                [
                    fieldElement,
                    function (error) {
                        deferred.resolve(error);
                    }
                ]
            );

            failError = (customResult == null || customResult.then)
                ? deferred
                : customResult;

        }

        var validateItem = {
            name: name,
            value: value,
            element: fieldElement,
            error: failError
        };

    };

});