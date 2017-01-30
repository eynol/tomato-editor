 //TODO: make it a server worker

 'use strict';


 importScripts('./js/sw/post.js','./js/sw/folder.js','./js/sw/content.js') 

 const editor_debug = true;

 function lg() {
     if (editor_debug) {
         console.log.apply(console, arguments)
     }
 }




 var dbName = "toMat0",
     version = 3,
     folder_name = "folders",
     post_name = "posts",
     content_name = "pbody";


 var initFolders = {
     id: "f" + Date.now(),
     name: "默认文件夹",
     index: 0
 }

 var initPosts = {
     id: "p" + Date.now(),
     fid: initFolders.id,
     title: "How to Use",
     brief: "",
     index: 0,
     created: Date.now(),
     modified: Date.now()
 }

 var initContent = {
     id: "c" + Date.now(),
     pid: initPosts.id,
     value: "test content"
 }


 function getDB() {

     return new Promise((resolve, reject) => {
         let request = indexedDB.open(dbName, version);
         request.onupgradeneeded = onupgradeneeded;
         request.onerror = (e) => {
             reject(e);
         }
         request.onsuccess = function(e) {
             resolve(e.target.result);
         }
     })

 }

 function onupgradeneeded(e) {
     let oldVer = e.oldVersion;
     let newVer = e.newVersion;
     let db = e.target.result;




     /**
      * password
      */
     if (!db.objectStoreNames.contains("password")) {

         let password = db.createObjectStore("password", {
             keyPath: "id"
         });

         password.createIndex("id", "id", {
             unique: true
         });

         password.createIndex("title", "title", {
             unique: true
         });
     }

     /**
      * folders
      */

     if (!(db.objectStoreNames.contains(folder_name))) {

         let folders = db.createObjectStore(folder_name, {
             keyPath: "id"
         });

         folders.createIndex("id", "id", {
             unique: true
         });

         folders.createIndex("index", "index", {
             unique: false
         });

         lg("in update", folders);
         folders.transaction.addEventListener("complete", function(event) {
             // Store values in the newly created objectStore.
             db.transaction(folder_name, "readwrite").objectStore(folder_name).add(initFolders);

         });
     }

     /**
      * posts
      */
     if (!db.objectStoreNames.contains(post_name)) {

         let posts = db.createObjectStore(post_name, {
             keyPath: "id"
         });

         posts.createIndex("id", "id", {
             unique: true
         });
         posts.createIndex("fid", "fid", {
             unique: false
         });

         posts.createIndex("index", "index", {
             unique: false
         });
         posts.createIndex("title", "title", {
             unique: false
         });

         posts.transaction.addEventListener("complete", function(event) {
             // Store values in the newly created objectStore.
             db.transaction(post_name, "readwrite").objectStore(post_name).add(initPosts);
         });
     }


     /**
      * content
      */
     if (!db.objectStoreNames.contains(content_name)) {

         let posts = db.createObjectStore(content_name, {
             keyPath: "id"
         });

         posts.createIndex("id", "id", {
             unique: true
         });
         posts.createIndex("pid", "pid", {
             unique: false
         });

         posts.transaction.addEventListener("complete", function(event) {
             // Store values in the newly created objectStore.
             db.transaction(content_name, "readwrite").objectStore(content_name).add(initContent);
         });
     }


     lg("onupgradeneeded event!\n%O", e);
 }

 function getDBobject(name, type) {
     return getDB().then((db) => {
         return Promise.resolve(db.transaction(name, type ? type : "readwrite").objectStore(name))
     })
 }

 function sortByIndex(a, b) {
     return a.index > b.index ? 1 : -1;
 }


 const strategy = {

     newFolder(params, ret) {
         return _Folder._newFolder(params, ret).then((some) => {
             ret.intent = ["renderPosts"]
             ret.posts = {}
             return Promise.resolve(ret)
         }).then(returnMSG)
     },
     getAllFolders(params, ret) {
         return Promise.all([_Folder._getAllFolders(params, ret), _Post._getAllPost(params, ret)]).then((list) => {
             return Promise.resolve(list[0])
         }).then(returnMSG)
     },
     renameFolder(params, ret) {
         return _Folder._renameFolder(params, ret)
     },
     updateFolderIndex(params, ret) {
         return _Folder._updateIndex(params, ret).then(returnMSG)
     },
     deleteFolder(params, ret) {
         return _Folder._deleteFolder(params, ret).then(returnMSG)
     },
     getPosts(params, ret) {
         return _Post._getAllPost(params, ret).then(returnMSG)
     },
     getContent(params, ret) {
         return _Content._getContent(params, ret).then(returnMSG)
     },
     newPost(params, ret) {
         return _Post._newPost(params, ret)
     },
     deletePost(params, ret) {
         return _Post._deletePost(params, ret).then(returnMSG)
     },
     updatePostIndex(params, ret) {
         return _Post._updateIndex(params, ret).then(returnMSG)
     },
     saveContent(params, ret) {
         return _Content._updateContent(params, ret).then(returnMSG)
     },
     updatePostTitle(params, ret) {
         return _Post._updateTitle(params, ret).then(returnMSG)
     }
 }

 function returnMSG(ret) {
     postMessage(JSON.stringify(ret))
     lg("request returnd %O", ret)
     return Promise.resolve(ret);
 }


 onmessage = function(e) {

     if (typeof e.data == "string") {
         let msg = JSON.parse(e.data),
             ret = {
                 intent: []
             };

         for (let i = 0; i < msg.intent.length; i++) {

             lg("request %s with %O", msg.intent[i], msg.params);
             strategy[msg.intent[i]](msg.params, ret)
                 .catch((e) => {
                     lg("opration failed due to :%O", e)
                     postMessage(JSON.stringify({
                         intent: ["error"],
                         message: e.message,
                         stack: e.stack
                     }))
                 });
         }
     }
 }
