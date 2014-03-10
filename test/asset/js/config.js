require.config({
    baseUrl: '/',
    paths: {
        //killer: 'http://s1.bdstatic.com/r/www/cache/biz/ecom/ui/20140306v1/killer',
        text: './test/asset/js/text'
    },
    packages: [
        {
            name: 'killer',
            location: './src',
            main: 'main'
        }
    ]
});
