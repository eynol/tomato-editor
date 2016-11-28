requirejs.config({
    baseUrl:"./js",
    paths:{
        page:'page',
        watcher:'watcher',
        lockkeeper:'lockkeeper',
        folder:'folder',
        post:'post',
        statusbar:'statusbar',
        workspace:'workspace',
        header:'header',
        notify:'notify',
        moment:'./../bower_components/moment/min/moment-with-locales.min',
        LS:'LS',
        Waves:'./../bower_components/Waves/dist/waves',
        template:"./../bower_components/art-template/dist/template",
        dynamics:"./../bower_components/dynamics.js/lib/dynamics"
    }
});

require(['lockkeeper','page'],function(lockkeeper,page){
    lockkeeper.init();

    
}); 