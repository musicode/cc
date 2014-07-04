define(function (require, exports, module) {

    /**
     * 此用例不完整
     * position left top 不论怎么设置，在终端测试取出来都是 ''
     */

    var position = require('cobble/function/position');

    describe('function/position', function () {

        it('position', function () {

            var element = $('<div></div>');

            var data = position(element);

            expect(data.position).toBe('absolute');
            expect(data.left).toBe(0);
            expect(data.top).toBe(0);


        });
    });
});