define(['require','exports','module'],function(require,exports,module){
    'use strict';
    
 var M = module.exports ,
     serviceWorker = new Worker("./../sw.js");

    serviceWorker.onmessage = function (msg) {
          console.timeEnd("ms");
          console.log(msg.data);
        }

    M.send = (obj)=>{
        serviceWorker.postMessage(JSON.stringify({"intent":obj}))
        console.time("ms");
    }

});