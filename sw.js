 //TODO: make it a server worker 

 'use strict';
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
     brief: "ds",
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
         request.onsuccess = function (e) {
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

         console.log("in update", folders);
         folders.transaction.addEventListener("complete", function (event) {
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

         posts.transaction.addEventListener("complete", function (event) {
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

         posts.transaction.addEventListener("complete", function (event) {
             // Store values in the newly created objectStore.
             db.transaction(content_name, "readwrite").objectStore(content_name).add(initContent);
         });
     }


     console.log(e);
 }

 function getDBobject(name, type) {
     return getDB().then((db) => {
         return Promise.resolve(db.transaction(name, type ? type : "readwrite").objectStore(name))
     })
 }

 function sortByIndex(a, b) {
     return a.index > b.index ? 1 : -1;
 }
 const _Post = {
     _getAllPost(params, ret) {
         return new Promise(function (resolve, reject) {
             ret.posts = {};

             /***
              * in params, there are two parameters,fid and pid.
              * fid must be works, and the pid may be null, so there is two kind situations
              * 1.pid is not null. return all posts(by fid) and make the pid actived(by pid); 
              * 2.pid is null. return all post(by fid) and make the post who's index equals 0 actived 
              * But if it's the first time to use ,the fid and pid is null.
              **/

             //define the normal way's solution (the fid must be exist)
             //
             function _get_posts_by_fid(fid, pid) {
                 return new Promise((_resolve, _reject) => {
                     //in this promis, don't resolve
                     getDBobject(post_name, "readonly").then((dbPost) => {

                         let req = dbPost.index("fid").getAll(IDBKeyRange.only(fid));
                         req.onsuccess = (e) => {
                             let list = e.target.result;
                             list.sort(sortByIndex);
                             ret.posts.list = list;
                             //ret.posts.active = pid;
                             // do not resolve the active
                             ret.intent.push("renderPosts");
                             _resolve(ret)
                         }

                         req.onerror = (e) => {
                             _reject(e);
                         }
                     })

                 }).then((_ret) => {
                     //in this promise ,we solve the pid's problem
                     if (pid != null) {
                         _ret.posts.active = pid;
                         return Promise.resolve(_ret);
                     } else {
                         return new Promise((_resolve, _reject) => {
                             //let's  get the post who's index equals 0
                             getDBobject(post_name, "readonly").then((dbPost4index) => {
                                 let req = dbPost4index.index("index").openKeyCursor(IDBKeyRange.only(0));
                                 req.onsuccess = (e) => {
                                     let _cursor = e.target.result;
                                     if (_cursor) {
                                         //we get the actived pid
                                         _ret.posts.active = _cursor.primaryKey;
                                         _resolve(_ret);
                                     } else {
                                         _reject(new Error("no post index equals 0 ,the posts' index is messed"))
                                     }
                                 }
                                 req.onerror = (e) => {
                                     _reject(e)
                                 }
                             })
                         })
                     }

                 })
             }
             //let start to solve our problem
             if (params.fid == null) {
                 //first time 
                 //we should get the folder's fid (index == 0),and then get all posts. Then active the post(index == 0)
                 getDBobject(folder_name, "readonly").then(function (folderdb) {
                     let index = folderdb.index("index"),
                         range = IDBKeyRange.only(0);
                     index.openKeyCursor(range).onsuccess = (e) => {
                         let fid = e.target.result.primaryKey;
                         //we get the fid and then solve it in  normal way,
                         resolve(_get_posts_by_fid(fid, params.pid))
                     }
                 })

             } else {
                 //fid is not null let's use it
                 resolve(_get_posts_by_fid(params.fid, params.pid))
             }

         });

     },
     _newPost(params, ret) {
         //once new a post all of posts' index will plus 1,then we add the new post
         return getDBobject(post_name).then((dbPost)=>{
             return new Promise((resolve,reject)=>{
                 let req = dbPost.index("fid").openCursor(IDBKeyRange.only(params.fid)),
                        func_error = (e)=>{reject(e)};
                 req.onsuccess = (e)=>{
                     let cursor = e.target.result;
                     if(cursor){
                         let post = cursor.value;
                         post.index +=1;
                         dbPost.put(post).onsuccess = (e)=>{
                             cursor.continue();
                         } 
                     }else{
                         dbPost.add(params).onsuccess = (e)=>{
                             resolve("ok")
                         }
                     }
                 }
                 req.onerror = func_error;
             })
         })
     },
     _updateIndex(params,ret){
          return getDBobject(post_name).then((dbPost) => {
             return new Promise((resolve, reject) => {
                 let cursor;
                 dbPost.openCursor().onsuccess = (e) => {
                     cursor = e.target.result;
                     if (cursor) {

                         if (params[cursor.key] != undefined) {
                             dbPost.get(cursor.key).onsuccess = (e) => {
                                 let f = e.target.result;
                                 f.index = params[cursor.key];
                                 let req = dbPost.put(f);
                                 req.onsuccess = (e) => {
                                     cursor.continue();
                                 }
                                 req.onerror = (e) => {
                                     reject(e)
                                 }
                             }
                         } else {
                             cursor.continue()
                         }
                     } else {
                         ret.intent.push("notify");
                         ret.info = "success!";
                         resolve(ret)
                     }
                 }
             })
         })
     }
 }


 const _Folder = {

     _newFolder(params, ret) {
         return getDBobject(folder_name).then((folders) => {
             return Promise.resolve(folders.add(params))
         })
     },
     _getAllFolders(params, ret) {
         return new Promise(function (resolve, reject) {
             //init our folders
             ret.folders = {};
             /***
              * In params, there are two parameters,fid and pid.
              * fid must be works,for the length of folders' length mustn't less than 1.
              * That's in normal situation,but if it's the first time to use,the fid is null;
              * 1.fid is not null,return all folders and make the folder(== fid) actived.
              * 2.fid is null ,return all folders and make the folder(index == 0) actived.
              **/


             //in this promise ,we do not solve the active
             getDBobject(folder_name).then((dbFolder) => {
                 dbFolder.getAll().onsuccess = (e) => {
                     let list = e.target.result;
                     list.sort(sortByIndex);
                     ret.intent.push("renderFolders");
                     ret.folders.list = list;
                     resolve(ret);
                 }
             })
         }).then((_ret) => {
             //we solve the active here
             if (params.fid != null) {
                 _ret.folders.active = params.fid;
                 return Promise.resolve(_ret)
             } else {
                 //we have to get the folder who's index eqauls 0
                 return new Promise((_resolve, _reject) => {
                     //let's  get the post who's index equals 0
                     getDBobject(folder_name, "readonly").then((dbFolder4Index) => {
                         let req = dbFolder4Index.index("index").openKeyCursor(IDBKeyRange.only(0));
                         req.onsuccess = (e) => {
                             let _cursor = e.target.result;
                             if (_cursor) {
                                 //we get the actived pid
                                 _ret.folders.active = _cursor.primaryKey;
                                 _resolve(_ret);
                             } else {
                                 _reject(new Error("no post index equals 0 ,the folders' index is messed"))
                             }
                         }
                         req.onerror = (e) => {
                             _reject(e)
                         }
                     })
                 })
             }
         })


     },
     _renameFolder(params, ret) {
         return getDBobject(folder_name).then((folder) => {

             return new Promise(function (resolve, reject) {
                 folder.get(params.id).onsuccess = (e) => {
                     let obj = e.target.result;
                     if (obj) obj.name = params.name;
                     let t = folder.put(obj);
                     t.onsuccess = (e) => {
                         resolve("ok");
                     }
                     t.onerror = (e) => {
                         reject(e)
                     }
                 }
             })


         })
     },
     _deleteFolder(params, ret) {
         return getDBobject(folder_name).then((folders) => {
             return new Promise((resolve, reject) => {
                 let req = folders.delete(params.id);
                 req.onsuccess = (e) => {
                     ret.intent.push("notify");
                     ret.info = "delete " + params.id + "successfully!";
                     resolve(ret)
                 };
                 req.onerror = (e) => {
                     reject(e)
                 }
             })
         })
     },
     _updateIndex(params, ret) {
         return getDBobject(folder_name).then((folders) => {
             return new Promise((resolve, reject) => {
                 let cursor;
                 folders.openCursor().onsuccess = (e) => {
                     cursor = e.target.result;
                     if (cursor) {

                         if (params[cursor.key] != undefined) {
                             folders.get(cursor.key).onsuccess = (e) => {
                                 let f = e.target.result;
                                 f.index = params[cursor.key];
                                 let req = folders.put(f);
                                 req.onsuccess = (e) => {
                                     cursor.continue();
                                 }
                                 req.onerror = (e) => {
                                     reject(e)
                                 }
                             }
                         } else {
                             cursor.continue()
                         }
                     } else {
                         ret.intent.push("notify");
                         ret.info = "success!";
                         resolve(ret)
                     }
                 }
             })
         })
     },


 };

 const _Content = {
     _getContent(params, ret) {
         return getDBobject(content_name).then((dbContent) => {
             return new Promise((resolve, reject) => {

                 let req = dbContent.index("pid").openCursor(IDBKeyRange.only(params.pid));
                 req.onsuccess = (e) => {

                     let content = e.target.result;
                     if (content) {
                         ret.content = content.value
                     } else {
                         ret.content = ""
                     }
                     ret.intent.push("renderContent");
                     resolve(ret)
                 }
                 req.onerror = (e) => {
                     reject(e)
                 }
             })
         })
     },
     _updateContent(params, ret) {
         return getDBobject(content_name).then((dbContent) => {
             return new Promise((resolve, reject) => {

                 let req = dbContent.get(params.id);
                 req.onsuccess = (e) => {
                     let content = e.target.result;
                     content.value = params.value
                     dbContent.put(content).onsuccess = (e) => {
                         ret.intent.push("notify");
                         ret.info = "更新内容成功";
                         resolve(ret)
                     }
                 }
                 req.onerror = (e) => {
                     reject(e)
                 }
             })
         })
     }
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
     updatePostIndex(params,ret){
         return _Post._updateIndex(params,ret).then(returnMSG)
     }
 }

 function returnMSG(ret) {
     postMessage(JSON.stringify(ret))
     return Promise.resolve(ret);
 }


 onmessage = function (e) {

     if (typeof e.data == "string") {
         let msg = JSON.parse(e.data),
             ret = {
                 intent: []
             };

         console.table(msg)
         for (let i = 0; i < msg.intent.length; i++) {
             strategy[msg.intent[i]](msg.params, ret)
                 .catch((e) => {
                     postMessage(JSON.stringify({
                         intent: ["error"],
                         error: e
                     }))
                 });
         }
     }
 }