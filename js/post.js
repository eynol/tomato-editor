define(['require', 'exports', 'module', 'watcher', "template", "dynamics", 'Waves'], function (require, exports, module, watcher, template, dynamics, Waves) {
    'use strict';



    var P = exports,
        status = watcher.status,
        domList = [],
        indexMap = {};


    P.new_post = watcher.$$("js-new-post");
    P.posts = watcher.$$("js-posts");


    P.init = function () {
        dom();

    }


    watcher.listen("clickFolder", (folder) => {

        fetch("./api/getPosts.json?" +
                watcher.toQuery({
                    id: folder.id,
                    t: Date.now()
                }))
            .then(watcher.respToJSON).then((json) => {
                watcher.trigger("renderPosts", json)

            })
            .catch(watcher.fetchError);

    })

    watcher.listen("renderPosts", (msg) => {
        var items;
        P.posts.innerHTML = "";
        P.posts.insertAdjacentHTML('afterBegin', template("tp-posts", msg));
        
        domList = msg.posts.list||[];
        indexMap = {};
        for (let i in domList) {
            indexMap[domList[i].id] = (+domList[i].index);
        }


        items = P.posts.children;
        // Animate each line individually
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

            Waves.attach(item);
        }



        watcher.activePost(msg.posts.active);
        watcher.trigger("clickPost", {
            id: msg.posts.active
        });

    })





    //this module's final part's is function dom 
    function dom() {


        //  new item
        P.new_post.addEventListener('click', (e) => {
            if (!e.isTrusted) return false;
            if (status.saved == false) {
                watcher.trigger("unsaved");
                return;
            }
            var posts = P.posts,
                li,
                li_list,
                html,
                newNode,
                newPost = {
                    id: "p" + Date.now(),
                    fid: status.id_folder,
                    title: "新建文档",
                    brief: "ds",
                    index:0,
                    created: Date.now(),
                    modified: Date.now()
                };


            dynamics.animate(e.target, {
                translateY: -20
            }, {
                type: dynamics.forceWithGravity,
                duration: 782,
                bounciness: 676,
                elasticity: 470,
                returnsToSelf: true,
                complete: () => {
                    dynamics.animate(e.target, {
                        translateY: 0
                    })
                }
            });


            li_list = posts.querySelectorAll(".active");
            for (let i = 0, len = li_list.length; i < len; i++) {
                li_list[i].classList.remove("active");
            }



            html = template("tp-post", newPost);

         
            domList.unshift(newPost);
            for(let i in domList){
                indexMap[domList[i].id] = (+i);
            }

            posts.insertAdjacentHTML("afterBegin", html);
            newNode = posts.children[0];

            Waves.attach(newNode, 'waves-light');
            dynamics.css(newNode, {
                translateX: -300,
            })

            dynamics.animate(newNode, {
                translateX: 0
            }, {
                type: dynamics.spring,
                friction: 300,
                duration: 1000,
            });

            watcher.send({
                intent:["newPost"],
                params:newPost
            })
       
            newNode.classList.add("active");
           
        })


        // P.posts.addEventListener("mousedown",function(e){
        //     console.log("down")
        //     e.preventDefault();

        // });
        //  P.posts.addEventListener("mouseup",function(e){
        //     console.log("up")
        //     e.preventDefault();

        // });
        P.posts.addEventListener("mousedown", (e) => {
            if (!e.isTrusted) return false;
            if (status.saved == false) {
                watcher.trigger("unsaved");
                return;
            }
            var el = e.target,
                li,
                id;

            switch (watcher.tag(el)) {
                case "li":
                    {
                        break;
                    }
                case "p":
                    {
                        el = el.parentElement;
                        break;
                    }
                default:
                    {
                        return false;
                    }
            }
            li = P.posts.querySelector(".active");
            if (li) li.classList.remove("active");
            el.classList.add("active");

            id = el.dataset["id"];
            watcher.activePost(id);
            watcher.setPostTitle(el.getAttribute("title"));
            watcher.send({
                intent: ["getContent"],
                params: {
                    pid: id
                }
            })
        })


        //
        //     drag event posts
        //
        P.posts.addEventListener("dragstart", (e) => {
            if (!e.isTrusted) return false;
            var df = e.dataTransfer,
                tagName = watcher.tag(e.target);

            df.setData("text/plain", "posts");
            df.effectAllowed = "All";
            df.dropEffect = "move";

            switch (tagName) {
                case "p":
                    {
                        P.temp = e.target.parentElement;
                        break;
                    }
                case "li":
                    {
                        P.temp = e.target;
                        break;
                    }
                default:
                    {
                        return false;
                    }
            }


        });

        P.posts.addEventListener("dragover", (e) => {
            if (!e.isTrusted) return false;
            e.dataTransfer.dropEffect = "move";
            e.preventDefault();
        });
        P.posts.addEventListener("drop", (e) => {

            e.preventDefault();
            //make sure it's domain is posts
            if (e.dataTransfer.getData("text/plain") != "posts") {
                P.temp = null;
                return false
            }
            if (e.target == P.temp || e.target.parentElement == P.temp) {
                P.temp = null;
                return;
            }
            // else
            let el = e.target,
                getNewNode = () => {
                    return P.temp.parentElement.removeChild(P.temp);
                },  
                oldIndex = indexMap[P.temp.dataset["id"]],
                newIndex;;


            switch (watcher.tag(el)) {

                case "p":
                    {

                         newIndex = indexMap[el.parentElement.dataset['id']];
                        el.parentElement.insertAdjacentElement('beforeBegin', getNewNode());
                        break;
                    }
                case "li":
                    {   
                         newIndex = indexMap[el.dataset['id']];
                        el.insertAdjacentElement('beforeBegin', getNewNode());
                        break;
                    }
                case "ul":
                    {
                        newIndex = P.posts.children.length-1; 
                        el.insertAdjacentElement('beforeEnd', getNewNode());
                        break;
                    }
                default:
                    {
                        return false;
                    }

            }

            P.temp = null;
             P.updateIndex(oldIndex, newIndex);
        })

    }
     P.updateIndex = (oldIndex, newIndex) => {
        console.log(oldIndex, newIndex)
        if (oldIndex == newIndex) return;
        let diff = {},
            i,
            old = domList.splice(oldIndex, 1)[0];
        domList.splice(newIndex, 0, old);

        if (oldIndex < newIndex) {
            for (i = oldIndex; i <= newIndex; i++) {
                indexMap[domList[i].id] = (+i);
                diff[domList[i].id] = (+i);
            }
        } else {
            for (i = newIndex; i <= oldIndex; i++) {
                indexMap[domList[i].id] = (+i);
                diff[domList[i].id] = (+i);
            }
        }
        console.table(diff)
        watcher.send({
            intent: ["updatePostIndex"],
            params: diff
        });
    }
});