define(function (require, exports, module) {

    var position = require('cobble/util/position');
    var positionStyle = require('cobble/function/position');

    describe('util/position', function () {


        var attachment;
        var attachmentTop;
        var attachmentRight;
        var attachmentBottom;
        var attachmentLeft;
        var attachmentCenter;
        var attachmentMiddle;

        var target;
        var targetWidth;
        var targetHeight;

        var options;

        beforeEach(
            function () {
                document.body.innerHTML = '<div id="attachment">attachment</div>'
                                        + '<div id="target">target</div>';

                attachment = $('#attachment');

                var offset = attachment.offset();

                attachmentTop = offset.top;
                attachmentRight = offset.left + attachment.width();
                attachmentBottom = offset.top + attachment.height();
                attachmentLeft = offset.left;
                attachmentCenter = attachmentLeft + attachment.width() / 2;
                attachmentMiddle = attachmentTop + attachment.height() / 2;

                target = $('#target');
                targetWidth = target.width();
                targetHeight = target.height();

                options = {
                    element: target,
                    attachment: attachment
                };
            }
        );

        it('topLeft', function () {
            position.topLeft(options);

            var style = positionStyle(target);
            expect(style.position).toBe('absolute');
            expect(style.left).toBe(attachmentLeft - targetWidth);
            expect(style.top).toBe(attachmentTop - targetHeight);
        });

        it('topCenter', function () {
            position.topCenter(options);

            var style = positionStyle(target);
            expect(style.left).toBe(attachmentCenter - targetWidth / 2);
            expect(style.top).toBe(attachmentTop - targetHeight);
        });

        it('topRight', function () {
            position.topRight(options);

            var style = positionStyle(target);
            expect(style.left).toBe(attachmentRight);
            expect(style.top).toBe(attachmentTop - targetHeight);
        });

        it('middleLeft', function () {
            position.middleLeft(options);

            var style = positionStyle(target);
            expect(style.left).toBe(attachmentLeft - targetWidth);
            expect(style.top).toBe(attachmentMiddle - targetHeight / 2);
        });

        it('middleCenter', function () {
            position.middleCenter(options);

            var style = positionStyle(target);
            expect(style.left).toBe(attachmentCenter - targetWidth / 2);
            expect(style.top).toBe(attachmentMiddle - targetHeight / 2);
        });

        it('middleRight', function () {
            position.middleRight(options);

            var style = positionStyle(target);
            expect(style.left).toBe(attachmentRight);
            expect(style.top).toBe(attachmentMiddle - targetHeight / 2);
        });

        it('bottomLeft', function () {
            position.bottomLeft(options);

            var style = positionStyle(target);
            expect(style.left).toBe(attachmentLeft - targetWidth);
            expect(style.top).toBe(attachmentBottom);
        });

        it('bottomCenter', function () {
            position.bottomCenter(options);

            var style = positionStyle(target);
            expect(style.left).toBe(attachmentCenter - targetWidth / 2);
            expect(style.top).toBe(attachmentBottom);
        });

        it('bottomRight', function () {
            position.bottomRight(options);

            var style = positionStyle(target);
            expect(style.left).toBe(attachmentRight);
            expect(style.top).toBe(attachmentBottom);
        });

    });
});