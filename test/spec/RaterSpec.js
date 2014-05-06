define(function (require, exports, module) {

    var Rater = require('cobble/ui/Rater');

    function reset() {
        document.body.innerHTML = '<div id="main"></div>';
    }

    describe('Rater', function () {

        it('init', function () {

            reset();

            var instance = new Rater({
                element: $('#main'),
                total: 5,
                value: 1
            });

            expect(instance.element.find('i').length).toBe(5);

            instance.dispose();
        });

        it('mouseenter & mouseleave', function () {

            reset();

            var onIcon = 'http://baidu.com/on';
            var offIcon = 'http://baidu.com/off';

            var instance = new Rater({
                element: $('#main'),
                total: 5,
                value: 1,
                onIcon: onIcon,
                offIcon: offIcon
            });

            var imgs = instance.element.find('i');
            $(imgs[2]).trigger('mouseenter');

            expect(imgs[0].className).toBe(onIcon);
            expect(imgs[1].className).toBe(onIcon);
            expect(imgs[2].className).toBe(onIcon);
            expect(imgs[3].className).toBe(offIcon);
            expect(imgs[4].className).toBe(offIcon);

            $(imgs[2]).trigger('mouseleave');

            expect(imgs[0].className).toBe(onIcon);
            expect(imgs[1].className).toBe(offIcon);
            expect(imgs[2].className).toBe(offIcon);
            expect(imgs[3].className).toBe(offIcon);
            expect(imgs[4].className).toBe(offIcon);

            instance.dispose();
        });

        it('onSelect', function () {

            reset();

            var onIcon = 'http://baidu.com/on';
            var offIcon = 'http://baidu.com/off';
            var onSelect = jasmine.createSpy('onSelect');

            var instance = new Rater({
                element: $('#main'),
                total: 5,
                value: 1,
                onIcon: onIcon,
                offIcon: offIcon,
                onSelect: onSelect
            });

            expect(onSelect).toHaveBeenCalled();

            var imgs = instance.element.find('i');
            $(imgs[2]).trigger('click');

            expect(onSelect.calls.count()).toBe(2);

            expect(imgs[0].className).toBe(onIcon);
            expect(imgs[1].className).toBe(onIcon);
            expect(imgs[2].className).toBe(onIcon);
            expect(imgs[3].className).toBe(offIcon);
            expect(imgs[4].className).toBe(offIcon);

            $(imgs[2]).trigger('mouseleave');

            expect(imgs[0].className).toBe(onIcon);
            expect(imgs[1].className).toBe(onIcon);
            expect(imgs[2].className).toBe(onIcon);
            expect(imgs[3].className).toBe(offIcon);
            expect(imgs[4].className).toBe(offIcon);

            instance.dispose();
        });

    });
});