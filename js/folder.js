define(['require', 'exports', 'module', 'watcher', 'Waves', 'template', "dynamics", 'notify'], function(require, exports, module, watcher, Waves, template, dynamics) {
    'use strict';
    var F = exports,
        status = watcher.status,
        domList = [],
        indexMap = {}; //local index records



    F.folders = watcher.$$("js-folders-ul");
    F.new_folder = watcher.$$("js-new-folder");

    F.folder_menu = watcher.$$("js-folder-menu")


    F.init = function() {
        dom();
    } // init



    watcher.listen("initPage", (e) => {
        initPage();
    })

    watcher.listen("renameFolder", (folder) => {
        console.log("rename to " + folder.name, folder.id);
        watcher.send({
            intent: ["renameFolder"],
            params: folder
        });
    })

    //  new folder
    watcher.listen("clickNewFolder", () => {

        var folder_id = "f" + Date.now(),
            newFolder = {
                id: folder_id,
                name: "新建文件夹",
                index: F.folders.children.length - 1 // array index starts from 0
            },
            html = template("tp-folder", newFolder),
            new_folder_li = F.folders.querySelector('.new-folder').parentElement,
            newNode;

        new_folder_li.insertAdjacentHTML('beforeBegin', html);
        newNode = new_folder_li.previousElementSibling;

        dynamics.css(newNode, {
            translateY: 50
        })
        dynamics.animate(newNode, {
            translateY: 0
        }, {
            type: dynamics.spring,
            frequency: 300,
            friction: 435,
            duration: 1000,
            complete: () => {
                dynamics.animate(newNode, {
                    translateY: 0
                });
            }
        });

        watcher.activeFolder(folder_id);

        domList.push(newFolder);
        indexMap[folder_id] = newFolder.index;

        setTimeout(() => {
            watcher.send({
                intent: ["newFolder"],
                params: newFolder
            })
        })

    })
    watcher.listen("renderFolders", (msg) => {
        var items;

        F.folders.innerHTML = "";
        F.folders.insertAdjacentHTML('afterbegin', template("tp-folders", msg));


        domList = msg.folders.list;
        indexMap = {};
        for (let i in domList) {
            indexMap[domList[i].id] = domList[i].index;
        }

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


        watcher.activeFolder(msg.folders.active);
    })

    watcher.listen("deleteFolder",(msg)=>{
        hideMenu()
        let oldlenth = domList.length;
        if(msg.code ===0){
          let index = indexMap[MenuCommands.id];
          lg("delete index of " +index +"folders",domList[index])
          F.folders.removeChild(F.folders.children[index]);
          domList.splice(index,1);
          lg("current domList is %O",domList);
          setTimeout(()=>{
            if(domList.length>=oldlenth){
              alert("oprations failed!")
            }
          },300)
        }else{
          alert(msg.info)
        }
        lg(msg.info)
    })

    function initPage() {

        // watcher.send("getAllFolders");

        // var query = watcher.toQuery({
        //     fid: status.id_folder,
        //     pid: status.id_post,
        //     t: Date.now()
        // });

        watcher.send({
            intent: ["getAllFolders"],
            params: {
                fid: status.id_folder,
                pid: status.id_post,
            }
        });

        // fetch("./api/getFolders.json?" + query)
        //     .then(watcher.respToJSON)
        //     .then((json) => {
        //         setTimeout(() => {
        //             watcher.trigger("renderFolders", json.folders)
        //         }, 0)
        //         setTimeout(() => {
        //             watcher.trigger("renderPosts", json.posts)
        //         }, 0);
        //     }).catch(watcher.fetchError);

    }

    let MenuCommands = {
        id:undefined,
        index:undefined,
        delete: ()=> {
            lg("MenuCommands delete id is :" + MenuCommands.id +"index is "+MenuCommands.index);
            watcher.send({
                intent: ["deleteFolder"],
                params: {
                    fid: MenuCommands.id,
                    index: MenuCommands.index
                }
            });
        }
    }

    function hideMenu() {
        lg("hide Menu");
        dynamics.animate(F.folder_menu, {
            opacity: 0,
            scale: .1
        }, {
            type: dynamics.easeInOut,
            duration: 300,
            friction: 100,
            complete: function() {
                dynamics.css(F.folder_menu, {
                    top: -5555,
                    left: -5555
                })
            }
        })
    }



    function dom() {
        //  click folder
        F.folders.addEventListener("click", function(e) {
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
                let id = el.dataset["id"];
                watcher.activeFolder(id)
                watcher.send({
                    intent: ["getPosts"],
                    params: {
                        fid: status.id_folder,
                        pid: null
                    }
                });
            }

        });




        F.folders.addEventListener('dblclick', function(e) {
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
            input.addEventListener("keypress", function(e) {
                if (!e.isTrusted) return false;
                if (e.keyCode == 13) {
                    input.blur();
                }
            })
            //when blur, change the input back to span element
            input.addEventListener("blur", function(e) {
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

        F.folders.addEventListener("contextmenu", (e) => {
            let target = e.target,
                tagName = target.tagName;
            lg("on folder contextmenu event:\n%O,tagName is:", e, tagName);

            if (!((target.classList.contains("new-folder")) || (["js-new-folder", "js-folders-ul"].indexOf(target.id) != -1))) {
                e.preventDefault();
                //calulate index of this element

                switch (tagName.toLowerCase()) {
                    case "span":
                        MenuCommands.id = target.parentElement.dataset.id;
                        MenuCommands.index = indexMap[MenuCommands.id];
                        break;
                    case "li":
                        MenuCommands.id = target.dataset.id;
                        MenuCommands.index = indexMap[MenuCommands.id];
                        break;
                }


                let x = e.pageX,
                    y = e.pageY;
                let items = F.folder_menu.firstElementChild.children;

                //show menu
                dynamics.css(F.folder_menu, {
                    opacity: 1,
                    left: x,
                    top: y
                })
                dynamics.animate(F.folder_menu, {
                    scale: 1,
                    translateY: 0
                }, {
                    type: dynamics.spring,
                    frequency: 200,
                    friction: 270,
                    duration: 800
                })
                for (var i = 0; i < items.length; i++) {
                    var item = items[i]
                    // Define initial properties
                    dynamics.css(item, {
                        opacity: 0,
                        translateY: 20
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

                //after show menu
                function handleClickEvent(e) {
                    lg("hadle contextmenu event")
                    let target = e.target;
                    let command = target.dataset.command || (target.firstElementChild && target.firstElementChild.dataset.command);
                    if (command) {
                        lg("command is:" + command);

                        MenuCommands[command] && MenuCommands[command]();
                    } else {
                        hideMenu()
                        window.removeEventListener("click", handleClickEvent);
                    }
                }


                window.addEventListener("click", handleClickEvent)

            } else {
                lg("not contextmenu")
            }
        }) //contextmenu event


        //
        //     drag event ul_folders
        //
        F.folders.addEventListener("dragstart", function(e) {
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

        F.folders.addEventListener("dragover", function(e) {
            if (!e.isTrusted) return false;
            e.dataTransfer.dropEffect = "move";
            e.preventDefault();
        });

        F.folders.addEventListener("drop", function(e) {
            if (!e.isTrusted) return false;

            e.preventDefault();
            //make sure it's domain is folder'
            if (e.dataTransfer.getData("text/plain") != "folder") {
                F.temp == null;
                return false
            }
            //  if the new node is "new folder" button , cancel the drop;
            if (F.temp.id == "js-new-folder") {
                F.temp == null;
                return false
            }
            if (e.target == F.temp || e.target.parentElement == F.temp) {
                F.temp = null;
                return;
            }
            // else
            var el = e.target,
                getNewNode = function() {
                    return F.temp.parentElement.removeChild(F.temp);
                },
                oldIndex = indexMap[F.temp.dataset["id"]],
                newIndex;


            switch (watcher.tag(el)) {
                case "span":
                    {

                        newIndex = indexMap[el.parentElement.dataset['id']];
                        el.parentElement.insertAdjacentElement('beforebegin', getNewNode());
                        break;
                    }

                case "li":
                    {
                        newIndex = indexMap[el.dataset['id']];
                        el.insertAdjacentElement('beforebegin', getNewNode())
                        break;
                    }
                case "ul":
                    {
                        newIndex = F.folders.children.length - 2; //it will insert before the node ,so it minus 2
                        F.folders.querySelector("#js-new-folder").insertAdjacentElement('beforebegin', getNewNode());
                        break;
                    }
                default:
                    {
                        return false;
                    }

            }
            F.temp == null;
            F.updateIndex(oldIndex, newIndex);
        })

    }

    F.updateIndex = (oldIndex, newIndex) => {
        console.log(oldIndex, newIndex)
        if (oldIndex == newIndex) return;
        let diff = {},
            i,
            old = domList.splice(oldIndex, 1)[0];
        domList.splice(newIndex, 0, old);

        if (oldIndex < newIndex) {
            for (i = oldIndex; i <= newIndex; i++) {
                indexMap[domList[i].id] = i;
                diff[domList[i].id] = i;
            }
        } else {
            for (i = newIndex; i <= oldIndex; i++) {
                indexMap[domList[i].id] = i;
                diff[domList[i].id] = i;
            }
        }
        console.log(diff)
        watcher.send({
            intent: ["updateFolderIndex"],
            params: diff
        });
    }
});
