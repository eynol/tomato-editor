define(['require', 'exports', 'module', 'watcher', 'dynamics'], function (require, exports, module, watcher, dynamics) {
    'use strict';


    var W = exports,
        status = watcher.status;




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
        watcher.saved()
    })


    /*
            subscribe renderPost 
    */
    watcher.listen("renderContent", (msg) => {
        let value = msg.content.value;

        W.textarea.value = value ? value : "";
        W.MDworker.postMessage(value);
        W.word_count.textContent = W.getWordsNum(value);

    })

    /*
             saveContent
    */
    watcher.listen("saveContent", () => {

        let content = W.textarea.value;
        if (content == status.post.value) {
            watcher.saved();
            return;
        }

        let post = {
            pid: status.id_post,
            brief: content.substr(0, 50),
            modified: Date.now(),
            value: content
        };

        watcher.send({
            intent: ["saveContent"],
            params: post
        });
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








    function dom() {



        /*
             click oprations button
        */
        W.undo.addEventListener("mousedown", () => {
            document.execCommand("undo", false, null);
        });
        W.redo.addEventListener("mousedown", () => {
            document.execCommand("redo", false, null);
        });


        W.air_mode.addEventListener("click", () => {
            if (status.isAirMode) {
                var method = document.exitFullscreen || document.webkitExitFullscreen || document.mozExitFullscreen || document.msExitFullscreen;
                method.call(document);
                status.isAirMode = false;
            } else {
                status.isAirMode = true;
                requestFullScreen(document.documentElement);
            }

        });



        /*
                textarea when input
        */


        W.textarea.addEventListener("input", (e) => {

            var content = e.target.value;

            if (content == status.post.value && status.saved != true) {
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

            if (e.keyCode == 83 && e.ctrlKey == true) {
                //ctrl+s key
                e.preventDefault();
                watcher.trigger("saveContent");
            }


        });
        /**
         *      save   btn
         */
        W.save.addEventListener("click", (e) => {
            watcher.trigger("saveContent");
        });
        /*
                open & close preview aside 
        */

        W.preview_btn.addEventListener("click", switchMode);

        switchMode(); //init the mode
    }

    function switchMode(e) {

        var pr = W.preview,
            cl = pr.classList,
            txa = W.textarea,
            quene = ['edit', 'both', 'preview'],
            index = 0,
            i,
            init = true;


        for (i in quene) {
            if (quene[i] == status.mode) {
                index = i;
                break;
            }
        }

        //if click
        if (typeof e == 'object') {
            if(init == true)init =false;
            index = ((i + 1) % 3);
        } else {

        }


        switch (Number(index)) {
            case 0:
                {
                    watcher.activeMode("edit");
                    dynamics.css(pr, {
                        width: 0,
                        opacity: 0,
                        paddingRight: 0,
                    })
                    dynamics.css(txa, {
                        width: "100%",
                        opacity: 1,
                        paddingLeft: 0
                    })
                    break;
                }
            case 1:
                {
                    watcher.activeMode("both");
                    dynamics.css(pr, {
                        width: "100%",
                        opacity: 1,
                        paddingLeft: 15
                    })
                    dynamics.css(txa, {
                        width: "100%",
                        opacity: 1,
                        paddingRight: 15
                    })
                    if(!init)W.sendToWorker(W.textarea.value);
                    break;
                }
            case 2:
                {
                    watcher.activeMode("preview");
                    dynamics.css(txa, {
                        width: 0,
                        opacity: 0,
                        paddingRight: 0
                    })
                    dynamics.css(pr, {
                        width: "100%",
                        opacity: 1,
                        paddingLeft: 0
                    });
                    break;
                }

        }

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