define(function (require, exports, module) {

    var imageDimension = require('cobble/function/imageDimension');

    describe('function/imageDimension', function (done) {

        it('main', function (done) {

            imageDimension(
                'https://d13yacurqjgara.cloudfront.net/assets/dribbble-checkerbg-lg-f363af80732a1ca71256dfb259a3c977.gif',
                function (width, height) {

                    expect(width).toBe(400);
                    expect(height).toBe(300);

                    done();
                }
            );

        });

    });
});