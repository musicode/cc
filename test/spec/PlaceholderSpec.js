define(function (require, exports, module) {

    var Placeholder = require('cobble/Placeholder');

    var defaultOptions = Placeholder.defaultOptions;
    defaultOptions.attribute = 'placeholder';
    defaultOptions.placeholderSelector = '#placeholder';
    defaultOptions.template = '<div id="placeholder-wrapper">'
                            +    '<div id="placeholder"></div>'
                            + '</div>';

    function reset() {
        document.body.innerHTML = '<input type="text" placeholder="abc" />';
    }

    describe('placeholderSelector', function () {

        it('init', function () {

            reset();

            var instance = new Placeholder({
                element: $('input')
            });

            var placeholderElement = $(instance.placeholderSelector);
            // 默认显示，不管有没有 placeholder
            expect(placeholderElement.css('display')).not.toBe('none');

            instance.dispose();
        });

        it('focus & blur', function () {

            reset();

            var instance = new Placeholder({
                element: $('input')
            });

            var placeholderElement = $(instance.placeholderSelector);

            instance.element.focus();
            expect(placeholderElement.css('display')).toBe('none');

            instance.element.blur();
            expect(placeholderElement.css('display')).not.toBe('none');

            $('#placeholder-wrapper').click();
            expect(placeholderElement.css('display')).toBe('none');

            instance.dispose();
        });

        it('setPlaceholder', function () {

            reset();

            var instance = new Placeholder({
                element: $('input')
            });

            var placeholderElement = $(instance.placeholderSelector);

            expect(instance.getPlaceholder()).toBe('abc');

            // 失焦状态改值
            instance.setPlaceholder('123');
            expect(placeholderElement.css('display')).not.toBe('none');
            expect(instance.getPlaceholder()).toBe('123');

            // 聚焦状态
            instance.element.focus();
            instance.setPlaceholder('456');
            expect(placeholderElement.css('display')).toBe('none');
            expect(instance.getPlaceholder()).toBe('456');

            instance.dispose();
        });

        it('消除原生 placeholder', function () {

            reset();

            var instance = new Placeholder({
                element: $('input'),
                attribute: 'data-placeholder'
            });

            expect(instance.element.attr('placeholder')).toBe('');
            expect(instance.getPlaceholder()).toBe('');

            instance.dispose();
        });

    });
});