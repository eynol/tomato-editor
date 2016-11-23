define(['require', 'exports', 'module', 'watcher', "template", "dynamics", 'Waves'], function (require, exports, module, watcher, template, dynamics, Waves) {
    'use strict';



    var P = exports,
        status = watcher.status;


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


        watcher.trigger("postsReady");
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
                newNode;


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

            html = template("tp-post", {
                title: "无标题文档",
                id: "a" + Date.now(),
                brief: "",
                date: new Date().toLocaleDateString()
            });

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

            setTimeout(() => {
                newNode.classList.add("active");
            }, 200)
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



            watcher.trigger('clickPost', {
                id: el.dataset["id"]
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
                };


            switch (watcher.tag(el)) {

                case "p":
                    {

                        el.parentElement.insertAdjacentElement('beforeBegin', getNewNode());
                        break;
                    }
                case "li":
                    {
                        el.insertAdjacentElement('beforeBegin', getNewNode());
                        break;
                    }
                case "ul":
                    {
                        el.insertAdjacentElement('beforeEnd', getNewNode());
                        break;
                    }
                default:
                    {
                        return false;
                    }

            }

            P.temp = null;

        })

    }
});