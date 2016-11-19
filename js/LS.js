/*

Maybe the editor's some variable could **POLLUTE** the namespcace of the original website,
to avoid this to happend , let's add a prefix to the every variable which this app is using in localStorage;

* original localStorage's API
	setpost : function(key, value)
	getpost : function(key)
	removepost : function(key)
	clear : function()
	length : int
	key : function(i)
	isVirtualObject : true
* this module's API 
	set : function(key, vlaue)
	get : function(key)
	remove : function(key)
	clear : function()
    getPrefix : function()
  
*/


define(['require','exports','module'],function(require,exports,module){
    'use strict';
    
    var prefix =  "t0mat0_",
        english = "abcdefghijklmnopqrst0123456789",
        unicode_char = '\u004F\u030C';

    
    exports.getPrefix = ()=>{
        return prefix;
    }
    exports.set = (key,value)=>{
        localStorage.setItem(prefix+key,value);
        return this;    
    }
    exports.get = (key)=>{
        return localStorage.getItem(prefix+key);
    }
    exports.remove = (key)=>{
        localStorage.removeItem(prefix+key);
         return this;
    }
    exports.clear = ()=>{
        var length  =localStorage.length,
            i = 0,
            key,
            reg = new RegExp("^"+prefix);
        for(;i<lenth;){
            key = localStorage.key(i);
            if(reg.test(key)){
                localStorage.removeItem(key);
                lenth--;
            }else{
                i++;
            }
        }
    }

    exports.abillityTest = ()=>{
        var e100 ;

        return '';
    }

});