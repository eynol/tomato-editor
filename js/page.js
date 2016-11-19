define(['require', 'exports', 'module', 'watcher','folder','post','workspace','header','statusbar','Waves','notify'],
 function (require, exports, module, watcher,folder,post,workspace,header,statusbar,Waves,notify) {
    'use strict';
         
        var $ = function (query) {
            return Array.prototype.slice.call(document.querySelectorAll(query))
        },
        P = exports = module.exports;

        Waves.init();


        folder.init();
        post.init();
        workspace.init();
        header.init();
        statusbar.init();
    //top buttons

   
    
 

});