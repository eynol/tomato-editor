define(['require','exports','module','watcher'],function(require,exports,module,watcher){
    'use strict';
    
    var N = module.exports;


    N.alert = (text)=>{
            setTimeout(()=>alert(text),0);
    }

    watcher.listen("unsaved",()=>{
         N.alert("文档未保存");
    })
});