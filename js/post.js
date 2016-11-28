define(['require', 'exports', 'module', 'watcher', "template", "dynamics", 'Waves', 'moment'], function (require, exports, module, watcher, template, dynamics, Waves, moment) {
    'use strict';



    var P = exports,
        status = watcher.status,
        domList = [],
        indexMap = {};


    P.new_post = watcher.$$("js-new-post");
    P.posts = watcher.$$("js-posts");
    P.post_title = watcher.$$("js-title");
    P.date_label = watcher.$$("js-date-label");

    P.init = function () {
        dom();

    }

    P.getDomPost = (id) => {
        return status.post = domList[indexMap[id]];
    }
    P.updateDomPost = (params) => {
        var attrList = ["modified", 'brief', 'title', 'value'],
            the_post = status.post,
            id = the_post.id;
        for (let i of attrList) {
            if (params[i] != undefined) {
                the_post[i] = params[i];
            }
        }

        let list_item = P.posts.children[indexMap[id]],
            title = list_item.children[0],
            brief = list_item.children[1],
            date = list_item.children[2];

            title.setAttribute("title",the_post.title);
            brief.setAttribute("title",the_post.brief);
            date.setAttribute("title",the_post.modified);



    }


    watcher.listen("saveContentSuccess", (msg) => {

    })

    watcher.listen("clickPost", (post) => {

        //send post to status
        P.getDomPost(post.pid);

        //other things
        watcher.activePost(post.pid);

        watcher.send({
            intent: ["getContent"],
            params: {
                pid: post.pid
            }
        })
    })

    watcher.listen("renderPosts", (msg) => {
        var items,
            activeid = msg.posts.active;
        P.posts.innerHTML = "";
        P.posts.insertAdjacentHTML('afterBegin', template("tp-posts", msg));

        domList = msg.posts.list || [];
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



        //  watcher.setPostTitle(el.children[0].getAttribute("title"));

        watcher.trigger("clickPost", {
            pid: activeid
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
                    index: 0,
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
            for (let i in domList) {
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
                intent: ["newPost"],
                params: newPost
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
        P.posts.addEventListener("click", (e) => {
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

            watcher.setPostTitle(el.children[0].getAttribute("title"));

            watcher.trigger("clickPost", {
                pid: id
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
                        newIndex = P.posts.children.length - 1;
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
        });

 


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