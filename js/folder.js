define(['require', 'exports', 'module', 'watcher', 'Waves', 'template', "dynamics", 'notify'], function (require, exports, module, watcher, Waves, template, dynamics) {
    'use strict';
    var F = exports,
        status = watcher.status;



    F.folders = watcher.$$("js-folders-ul");
    F.new_folder = watcher.$$("js-new-folder");




    F.init = function () {
            dom();
        } // init 



    watcher.listen("initPage", (e) => {
        initPage();
    })

    watcher.listen("renameFolder", (folder) => {
        console.log("rename to " + folder.name, folder.id);
        folder.then();
    })

    //  new folder
    watcher.listen("clickNewFolder", () => {

        var folder_id = "f_" + Date.now(),
            html = template("tp-folder", {
                id: "f_" + Date.now(),
                name: "新建文件夹"
            }),
            new_folder_li = F.folders.querySelector('.new-folder').parentElement;


        new_folder_li.insertAdjacentHTML('beforeBegin', html);


        //animate the new folder
        new_folder_li = new_folder_li.previousElementSibling;

        dynamics.css(new_folder_li, {
            translateY: 50
        })
        dynamics.animate(new_folder_li, {
            translateY: 0
        }, {
            type: dynamics.spring,
            frequency: 300,
            friction: 435,
            duration: 1000,
            complete: () => {
                dynamics.animate(new_folder_li, {
                    translateY: 0
                });
            }
        });

        watcher.trigger("clickFolder", {
            id: folder_id
        });
        //TODO:new API
    })
    watcher.listen("renderFolders", (json) => {
        var items;

        F.folders.innerHTML = "";
        F.folders.insertAdjacentHTML('afterbegin', template("tp-folders", json));

        items = F.folders.children;

        // Animate each line individually
        for (var i = 0; i < items.length; i++) {
            var item = items[i]
                // Define initial properties
            dynamics.css(item, {
                opacity: 0,
                translateY: 38
            })

            // Animate to final properties
            dynamics.animate(item, {
                opacity: 1,
                translateY: 0
            }, {
                type: dynamics.spring,
                frequency: 300,
                friction: 435,
                duration: 1000,
                delay: 100 + i * 40
            })
        }


        watcher.activeFolder(json.active);
        setTimeout(() => {
            watcher.trigger("foldersReady")
        }, 1)
    })



    function initPage() {

        // watcher.send("getAllFolders");

        var query = watcher.toQuery({
            fid: status.id_folder,
            pid: status.id_post,
            t: Date.now()
        });
        fetch("./api/getFolders.json?" + query)
            .then(watcher.respToJSON)
            .then((json) => {
                setTimeout(() => {
                    watcher.trigger("renderFolders", json.folders)
                }, 0)
                setTimeout(() => {
                    watcher.trigger("renderPosts", json.posts)
                }, 0);
            }).catch(watcher.fetchError);

    }




    function dom() {
        //  click folder
        F.folders.addEventListener("click", function (e) {
            if (!e.isTrusted) return false;
            if (status.saved == false) {
                watcher.trigger("unsaved");
                return;
            }

            var el = e.target,
                newFolder;

            switch (watcher.tag(el)) {
                case "li":
                    {
                        break;
                    }
                case "span":
                    {
                        el = el.parentElement;
                        break;
                    }
                default:
                    {
                        return;
                    }
            }
            let li = el.parentElement.querySelector(".active");
            if (li) li.classList.remove("active");

            newFolder = el.parentElement.querySelector(".new-folder");
            if (newFolder && (newFolder.parentElement == el)) {
                watcher.trigger("clickNewFolder")
            } else {
                el.classList.add("active");
                dynamics.animate(el, {
                    translateY: 10
                }, {
                    type: dynamics.bounce,
                    frequency: 300,
                    friction: 435,
                    duration: 1000,
                    complete: () => {
                        dynamics.animate(el, {
                            translateY: 0
                        });
                    }
                });
                watcher.trigger("clickFolder", {
                    id: el.dataset["id"]
                });
            }

        });




        F.folders.addEventListener('dblclick', function (e) {
            if (!e.isTrusted) return false;
            e.preventDefault();
            var el = e.target,
                value,
                input = document.createElement("input");
            switch (watcher.tag(el)) {
                case "span":
                    {
                        el = el.parentElement;
                        break;
                    }
                case "li":
                    {
                        break;
                    }
                default:
                    {
                        return;
                    }
            }
            // el is li element
            F.temp = value = el.textContent;

            input.setAttribute("type", 'text');
            input.style.width = el.offsetWidth + "px";
            input.setAttribute("value", value);
            el.innerHTML = "";
            input = el.insertAdjacentElement('afterbegin', input);
            //input
            input.focus();
            //put the cursor in the end
            input.setSelectionRange(value.length, value.length);

            //when press enter ,make the input blur
            input.addEventListener("keypress", function (e) {
                    if (!e.isTrusted) return false;
                    if (e.keyCode == 13) {
                        input.blur();
                    }
                })
                //when blur, change the input back to span element
            input.addEventListener("blur", function (e) {
                if (!e.isTrusted) return false;
                var el = e.target,
                    li = el.parentElement;
                el.parentElement.innerHTML = "<span>" + watcher.escape(el.value) + "</span>";
                input = null;

                watcher.trigger("renameFolder", {
                    name: watcher.escape(el.value),
                    id: li.dataset["id"]
                });
            })


        });




        //
        //     drag event ul_folders
        //
        F.folders.addEventListener("dragstart", function (e) {
            if (!e.isTrusted) return false;
            if (watcher.tag(e.target.children[0]) == "input" || watcher.tag(e.target) == "input") {
                e.preventDefault();
                return false
            };
            e.dataTransfer.effectAllowed = "All";
            e.dataTransfer.dropEffect = "move";
            e.dataTransfer.setData("text/plain", "folder");
            F.temp = e.target;


        })

        F.folders.addEventListener("dragover", function (e) {
            if (!e.isTrusted) return false;
            e.dataTransfer.dropEffect = "move";
            e.preventDefault();
        });

        F.folders.addEventListener("drop", function (e) {
            if (!e.isTrusted) return false;

            e.preventDefault();
            //make sure it's domain is folder'
            if (e.dataTransfer.getData("text/plain") != "folder") {
                F.temp == null;
                return false
            }
            //  if the new node is "new folder" button , cancel the drop;
            if (F.temp.children[0].id == "js-new-folder") {
                F.temp == null;
                return false
            }
            if (e.target == F.temp || e.target.parentElement == F.temp) {
                F.temp = null;
                return;
            }
            // else
            var el = e.target,
                getNewNode = function () {
                    return F.temp.parentElement.removeChild(F.temp);
                };


            switch (watcher.tag(el)) {
                case "span":
                    {

                        el.parentElement.insertAdjacentElement('beforebegin', getNewNode());
                        break;
                    }

                case "li":
                    {

                        el.insertAdjacentElement('beforebegin', getNewNode())
                        break;
                    }
                case "ul":
                    {
                        F.folders.querySelector("#js-new-folder").insertAdjacentElement('beforebegin', getNewNode());
                        break;
                    }
                default:
                    {
                        return false;
                    }

            }
            F.temp == null;


        })

    }

});