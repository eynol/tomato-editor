define(['require', 'exports', 'module', 'watcher', 'dynamics'], function (require, exports, module, watcher, dynamics) {
    'use strict';


    var W = exports,
        status = watcher.status,
        oriPost = {};



   
    W.word_count = watcher.$$("js-word-count");

    W.save = watcher.$$("js-o-save");
    W.undo = watcher.$$("js-o-undo");
    W.redo = watcher.$$("js-o-redo")

    W.history = watcher.$$("js-o-history");
    W.preview_btn = watcher.$$("js-o-preview");
    W.air_mode = watcher.$$("js-o-air-mode");

  

    W.textarea = watcher.$$("js-edit");
    W.preview = watcher.$$("js-preview");
    W.MDworker = {};


    W.init = () => {
        dom();
        initMDworker();
    }



    watcher.listen("saveContentSuccess", (msg) => {
        oriPost.value = msg.params.value;
        watcher.saved()
    })


    /*
            subscribe renderPost 
    */
    watcher.listen("renderContent", (msg) => {
        let content = msg.content,
            value = content.value;
        oriPost.value = value ? value : "";
        W.input_title.value = status.post_title;
        W.textarea.value = value ? value : "";
        W.MDworker.postMessage(value ? value : "空白文档");
        W.word_count.textContent = W.getWordsNum(value);

    })

    /*
             saveContent
    */
    watcher.listen("saveContent", () => {

        var content = W.textarea.value,
            post = {
                pid: status.id_post,
                name: W.input_title.value,
                brief: content.substr(0, 50),
                modified: Date.now(),
                value: content
            };

        watcher.send({
            intent: ["saveContent"],
            params: post
        })
    })


    /*
             sendToWorker debounced function
    */
    W.sendToWorker = watcher.debounce((content) => {
        W.MDworker.postMessage(content);
    }, 1200, true);

    /*
        (String content)-> number of charactors 
    */
    W.getWordsNum = (content) => {
        if (content) {
            var ret = content.replace(/\s*/gim, "")
            return ret.length;
        } else {
            return 0
        }
    }



    W.halfHide = (el) => {
        dynamics.css(el, {
            display: "none",
        })
    }
    W.halfShow = (el) => {
        dynamics.css(el, {
            display: "block"
        })

    }




    function dom() {
       


        /*
             click oprations button
        */
        W.undo.addEventListener("mousedown", () => {
            document.execCommand("undo", false, null);
        })
        W.redo.addEventListener("mousedown", () => {
            document.execCommand("redo", false, null);
        })


        W.air_mode.addEventListener("click", () => {
            if (status.isAirMode) {
                var method = document.exitFullscreen || document.webkitExitFullscreen || document.mozExitFullscreen || document.msExitFullscreen;
                method.call(document);
                status.isAirMode = false;
            } else {
                status.isAirMode = true;
                requestFullScreen(document.documentElement);
            }

        })



        /*
                textarea when input
        */


        W.textarea.addEventListener("input", (e) => {
            if (!e.isTrusted) return false;
            var content = e.target.value;

            if (content == oriPost.value && status.saved != true) {
                watcher.saved()
            } else if (status.saved == true) {
                watcher.unsaved()
            }

            if (status.mode != "edit") {
                W.sendToWorker(content);
            }

            W.word_count.textContent = W.getWordsNum(content);

        });

        W.textarea.addEventListener("keydown", (e) => {
                if (!e.isTrusted) return false;
                if (e.keyCode == 83 && e.ctrlKey == true) {
                    //ctrl+s key
                    e.preventDefault();
                    watcher.trigger("saveContent");
                }
                // else if(e.keyCode == 9){
                //     tab key
                //      e.preventDefault();
                // };

            })
            /**
             *      save   btn
             */
        W.save.addEventListener("click", (e) => {
                watcher.trigger("saveContent");
            })
            /*
                    open & close preview aside 
            */

        W.preview_btn.addEventListener("click", () => {
            var pr = W.preview,
                cl = pr.classList,
                txa = W.textarea;

            switch (status.mode) {
                case "preiview":
                    {
                        watcher.activeMode("edit");
                        //hide preview
                        W.halfHide(pr);
                        W.halfShow(txa);
                        break;
                    }
                case "edit":
                    {
                        watcher.activeMode("both");
                        W.halfShow(pr);
                        break;
                    }
                case "both":
                    {
                        watcher.activeMode("preiview");
                        W.halfHide(txa);

                        break;
                    }

            }


        });

    }


    function initMDworker() {

        W.MDworker = new Worker("./MDworker.js");

        W.MDworker.onmessage = function (e) {
            if (!e.isTrusted) return false;
            W.preview.innerHTML = "";
            W.preview.insertAdjacentHTML("afterBegin", e.data);
        }
    }


    function requestFullScreen(element) {
        var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;
        if (requestMethod) {
            requestMethod.call(element);
        } else if (typeof window.ActiveXObject !== "undefined") {
            var wscript = new ActiveXObject("WScript.Shell");
            if (wscript !== null) {
                wscript.SendKeys("{F11}");
            }
        }
    }
});