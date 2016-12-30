define(['require', 'exports', 'module', 'LS'], function (require, exports, module, LS) {
    'use strict';
    ///
    /// subscriber / publisher patterns
    ///
    var clientList = [];

    exports.listen = function (key, fn) {
        if (!clientList[key]) {
            clientList[key] = [];
        }
        clientList[key].push(fn);
    };

    exports.trigger = function () {
        var key = Array.prototype.shift.call(arguments),
            fns = clientList[key];
        if (!fns || fns.length === 0) {
            return false;
        }
        for (var i = 0, fn; fn = fns[i++];) {
            fn.apply(this, arguments);
        }
    };

    exports.remove = function (key, fn) {
        var fns = clientList[key];
        if (!fns) {
            return false;
        }
        if (!fn) {
            fns && (fns.length = 0);
        } else {
            for (var l = fns.length - 1; l >= 0; l--) {
                var _fn = fns[l];
                if (_fn === fn) {
                    fns.splice(1, 1);
                }
            }
        }
    }

    //throttle function
    exports.throttle = function (fn, delay, immediate, debounce) {
        var curr = +new Date(), //当前事件
            last_call = 0,
            last_exec = 0,
            timer = null,
            diff, //时间差
            context, //上下文
            args,
            exec = function () {
                last_exec = curr;
                fn.apply(context, args);
            };
        return function () {
            curr = +new Date();
            context = this,
                args = arguments,
                diff = curr - (debounce ? last_call : last_exec) - delay;
            clearTimeout(timer);
            if (debounce) {
                if (immediate) {
                    timer = setTimeout(exec, delay);
                } else if (diff >= 0) {
                    exec();
                }
            } else {
                if (diff >= 0) {
                    exec();
                } else if (immediate) {
                    timer = setTimeout(exec, -diff);
                }
            }
            last_call = curr;
        }
    };

    exports.debounce = function (fn, delay, immediate) {
        return exports.throttle(fn, delay, immediate, true);
    };












    //
    //  here we go
    //
    var W = exports = module.exports,
        status = W.status = {
            post:{}
        };


    W.activeFolder = (fid) => {
        LS.set("id_folder", fid);
        status.id_folder = fid;
        W.trigger("statusChange")
    }

    W.activePost = (aid) => {
        LS.set("id_post", aid);
        status.id_post = aid;
        W.trigger("statusChange")
    }

    W.unsaved = () => {
        status.saved = false;
        W.trigger("statusChange")
    }
    W.saved = () => {
        status.saved = true;
        W.trigger("statusChange")
    }
    W.saveContent = (post) => {
        W.saved();
    }
    W.activeMode = (mode) => {
        LS.set("mode", mode);
        status.mode = mode;
        W.trigger("statusChange")
    }
    W.setPostTitle = (post_title) => {
        LS.set("post_title", post_title);
        status.post_title = post_title;
        W.trigger("statusChange")
    }


    status.id_folder = LS.get('id_folder');
    status.id_post = LS.get("id_post");
    status.post_title = LS.get("post_title");
    status.instant_saved = LS.get("instant_save");
    status.mode = LS.get("mode");

    if (!status.mode) {
        status.mode = "both";
        LS.set("mode", "both");
    }

    status.saved = LS.get("saved");

    if (status.saved !== false) {
        W.saved();
        LS.set("saved", true);
    }

    status.last_edit_date = LS.get("last_edit_date");
    status.cursor_index = LS.get("cursor_index");

    status.cache_length = LS.get("cache_length");
    status.cache_index = LS.get("cache_index");
    status.cache_internal = LS.get("cache_internal");







    W.tag = (el) => {
        return el.tagName.toLowerCase();
    }
    W.$$ = (id) => {
        return document.getElementById(id)
    }

    W.escape = (str) => {
        str = str.replace("<", '&lt;');
        str = str.replace('>', '&gt;');
        return str;
    }
    W.toQuery = (obj) => {
        var str = "";
        for (var i in obj) {
            str += "&" + i + "=" + obj[i];
        }
        return str.substring(1);
    }


    W.prefix = LS.getPrefix();




    W.respToJSON = (resp) => {
        if (resp.status != 200) return Promise.reject("something bad");
        return resp.json()
    }
    W.fetchError = (err) => {
        console.log(err);
    }


    /**
     * pretent we have a serviceWorker
     */

    var serviceWorker = new Worker("/apps/sw.js");

    serviceWorker.onmessage = function (e) {
        if (typeof e.data == "string") {
            let msg = JSON.parse(e.data);
            console.log(msg);
            for (let i = 0; i < msg.intent.length; i++) {
                W.trigger(msg.intent[i], msg)
            }
        }
    }




    W.send = (obj) => {
        serviceWorker.postMessage(JSON.stringify(obj))
    }







    /**
     * fullscreenchange function 
     **/
    function fullscreenchange(e) {
        if (!e.isTrusted) return false;
        if (status.isAirMode) {
            W.trigger("fullScreen");
        } else {
            W.trigger("exitFullScreen");
        }
    }

    document.addEventListener("fullscreenchange", fullscreenchange);
    document.addEventListener("mozfullscreenchange", fullscreenchange);
    document.addEventListener("webkitfullscreenchange", fullscreenchange);
    document.addEventListener("msfullscreenchange", fullscreenchange);

    ///ie 

});