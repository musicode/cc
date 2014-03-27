define(function (require, exports, module) {

    var position = require('cobble/position');

    describe('position', function () {

        it('测试 9 个方位', function () {

            document.body.innerHTML = '<div id="attachment">attachment</div>'
                                    + '<div id="target">target</div>';

            var attachment = $('#attachment');
            var target = $('#target');

            var offset = attachment.offset();
            var attachmentRect = {
                left: offset.left,
                right: offset.left + attachment.width(),
                top: offset.top,
                bottom: offset.top + attachment.height()
            };
            attachmentRect.center = attachmentRect.left + (attachmentRect.right - attachmentRect.left) / 2;
            attachmentRect.middle = attachmentRect.top + (attachmentRect.bottom - attachmentRect.top) / 2;

            var targetWidth = target.width();
            var targetHeight = target.height();
            var options = {
                element: target,
                attachment: attachment
            };



            position.topLeft(options);

            // 自动设置为 absolute，否则无法定位
            expect(target.css('position')).toBe('absolute');
            expect(target.css('left')).toBe((attachmentRect.left - targetWidth) + 'px');
            expect(target.css('top')).toBe((attachmentRect.top - targetHeight) + 'px');

            position.topCenter(options);
            expect(target.css('left')).toBe((attachmentRect.center - targetWidth / 2) + 'px');
            expect(target.css('top')).toBe((attachmentRect.top - targetHeight) + 'px');

            position.topRight(options);
            expect(target.css('left')).toBe(attachmentRect.right + 'px');
            expect(target.css('top')).toBe((attachmentRect.top - targetHeight) + 'px');



            position.middleLeft(options);
            expect(target.css('left')).toBe((attachmentRect.left - targetWidth) + 'px');
            expect(target.css('top')).toBe((attachmentRect.middle - targetHeight / 2) + 'px');

            position.middleCenter(options);
            expect(target.css('left')).toBe((attachmentRect.center - targetWidth / 2) + 'px');
            expect(target.css('top')).toBe((attachmentRect.middle - targetHeight / 2) + 'px');

            position.middleRight(options);
            expect(target.css('left')).toBe(attachmentRect.right + 'px');
            expect(target.css('top')).toBe((attachmentRect.middle - targetHeight / 2) + 'px');




            position.bottomLeft(options);
            expect(target.css('left')).toBe((attachmentRect.left - targetWidth) + 'px');
            expect(target.css('top')).toBe(attachmentRect.top + 'px');

            position.bottomCenter(options);
            expect(target.css('left')).toBe((attachmentRect.center - targetWidth / 2) + 'px');
            expect(target.css('top')).toBe(attachmentRect.top + 'px');

            position.bottomRight(options);
            expect(target.css('left')).toBe(attachmentRect.right + 'px');
            expect(target.css('top')).toBe(attachmentRect.top + 'px');
        });
    });
});