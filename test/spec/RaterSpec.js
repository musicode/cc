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

            expect(instance.element.find('img').length).toBe(5);

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

            var imgs = instance.element.find('img');
            $(imgs[2]).trigger('mouseenter');

            expect(imgs[0].src).toBe(onIcon);
            expect(imgs[1].src).toBe(onIcon);
            expect(imgs[2].src).toBe(onIcon);
            expect(imgs[3].src).toBe(offIcon);
            expect(imgs[4].src).toBe(offIcon);

            $(imgs[2]).trigger('mouseleave');

            expect(imgs[0].src).toBe(onIcon);
            expect(imgs[1].src).toBe(offIcon);
            expect(imgs[2].src).toBe(offIcon);
            expect(imgs[3].src).toBe(offIcon);
            expect(imgs[4].src).toBe(offIcon);

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

            var imgs = instance.element.find('img');
            $(imgs[2]).trigger('click');

            expect(onSelect.calls.count()).toBe(2);

            expect(imgs[0].src).toBe(onIcon);
            expect(imgs[1].src).toBe(onIcon);
            expect(imgs[2].src).toBe(onIcon);
            expect(imgs[3].src).toBe(offIcon);
            expect(imgs[4].src).toBe(offIcon);

            $(imgs[2]).trigger('mouseleave');

            expect(imgs[0].src).toBe(onIcon);
            expect(imgs[1].src).toBe(onIcon);
            expect(imgs[2].src).toBe(onIcon);
            expect(imgs[3].src).toBe(offIcon);
            expect(imgs[4].src).toBe(offIcon);

            instance.dispose();
        });

    });
});