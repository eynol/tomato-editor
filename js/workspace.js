define(['require', 'exports', 'module', 'watcher', 'dynamics'], function (require, exports, module, watcher, dynamics) {
    'use strict';


    var W = exports,
        status = watcher.status,
        oriPost;



    W.input_title = watcher.$$("js-title");
    W.date_label = watcher.$$("js-date-label");
    W.word_count = watcher.$$("js-word-count");

    W.save = watcher.$$("js-o-save");
    W.undo = watcher.$$("js-o-undo");
    W.redo = watcher.$$("js-o-redo")

    W.history = watcher.$$("js-o-history");
    W.preview_btn = watcher.$$("js-o-preview");
    W.air_mode = watcher.$$("js-o-air-mode");

    W.setting = watcher.$$("js-o-setting");

    W.textarea = watcher.$$("js-edit");
    W.preview = watcher.$$("js-preview");
    W.MDworker = {};


    W.init = () => {
        dom();
        initMDworker();
    }



    watcher.listen("clickPost", (post) => {
        W.getPost(post.id);
        watcher.activePost(post.id);
    })

    /*
             get post fuction
    */
    W.getPost = (pid) => {
        if ((!!pid) == false) {
            watcher.trigger("noContent");
            return;
        }
        fetch("./api/getPost.json?" + watcher.toQuery({
                id: pid,
                t: Date.now()
            }))
            .then(watcher.respToJSON)
            .then((json) => {
                oriPost = json;
                watcher.trigger('renderPost', json);
            }).catch(watcher.fetchError)
    }

    /*
            subscribe renderPost 
    */
    watcher.listen("renderPost", (post) => {
        W.input_title.value = post.title;
        W.textarea.value = post.content;
        W.MDworker.postMessage(post.content);
        W.word_count.textContent = W.getWordsNum(post.content);

        watcher.setPostTitle(post.title);
    })

    /*
             renderPost
    */
    watcher.listen("savePost", () => {
        var content = W.textarea.value,
            post = {
                id: status.id_post,
                name: W.input_title.value,
                brief: content.substr(0, 50),
                date: Date.now()
            };
        console.log(post);
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
        var ret = content.replace(/\s*/gim, "")
        return ret.length;
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
        title focus & blur
        */

        W.input_title.addEventListener('change', (e) => {

            var value = e.target.value,
                postID = status.id_post;

            if (value != oriPost.title) {
                watcher.trigger("rename", {
                    name: value,
                    id: postID,
                    then: () => {
                        oriPost.title = value;
                    }
                })
                console.log("rename", value, postID);
            }

        })



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

            if (content == oriPost.content && status.saved != true) {
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
                watcher.trigger("savePost");
            }
            // else if(e.keyCode == 9){
            //     tab key
            //      e.preventDefault();
            // };

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