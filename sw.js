 //TODO: make it a server worker 

'use strict';
 var dbName = "toMat0",
     version = 3,
     folder_name = "folders",
     post_name = "posts";




 var initFolders = [{
     id: "f" + Date.now(),
     name: "默认文件夹",
     index: 0
 }]

 var initPosts = [{
     id: "p1234",
     fid:initFolders[0].id,
     title: "How to Use",
     index: 0,
     created:Date.now(),
     modified:Date.now()
 }]

getDB();

function getDB() {
     
     return new Promise((resolve, reject) => {
         let request = indexedDB.open(dbName, version);
         request.onupgradeneeded = onupgradeneeded;
         request.onerror = (e) => {
             reject(e);
         }
         request.onsuccess = function (e) {
             console.log("getDB success")
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
       console.log("update");
     if (!(db.objectStoreNames.contains(folder_name))) {

         let folders = db.createObjectStore(folder_name, {
             keyPath: "id"
         });

         folders.createIndex("id", "id", {
             unique: true
         });

         folders.createIndex("name", "name", {
             unique: false
         });
        
         console.log("in update",folders);
         folders.transaction.addEventListener ("complete",function (event) {
             // Store values in the newly created objectStore.
             let obj = db.transaction(folder_name, "readwrite").objectStore(folder_name);
               console.log("in update");
             for (let i in initFolders) {
                 obj.add(initFolders[i]);
                 console.log(i);
             }
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

         posts.createIndex("title", "title", {
             unique: false
         });

         posts.transaction.addEventListener("complete" , function (event) {
             // Store values in the newly created objectStore.
             let obj = db.transaction(post_name, "readwrite").objectStore(post_name);
             for (let i in initPosts) {
                 obj.add(initPosts[i]);
             }
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
         return getDB().then((db) => {
             return db
         }).then(function (db) {
             return new Promise(function (resolve, reject) {
                 let posts = db.transaction(post_name, "readonly").objectStore(post_name),
                     list = [],
                     cursor,
                     hit = false;

                 ret.posts = {};

                 posts.openCursor().onsuccess = function (e) {
                     cursor = e.target.result;
                     if (cursor) {
                         if (cursor.key == params.pid) hit = true;
                         list.push(cursor.value);
                         cursor.continue();
                     } else {
                         list.sort(sortByIndex);
                         if (hit) {
                             ret.posts.active = params.pid
                         } else {
                             if (list.length != 0)
                                 ret.posts.active = list[0].id;
                         }
                         ret.intent.push("renderPosts");
                         ret.posts.list = list;
                         resolve(ret);
                     }
                 }
             });
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
         return getDB().then((db) => {
             return db
         }).then(function (db) {
             return new Promise(function (resolve, reject) {
                 let folders = db.transaction(folder_name, "readonly").objectStore(folder_name),
                     list = [],
                     cursor,
                     hit = false;

                ret.folders = {};

                folders.getAll().onsuccess = (e)=>{
                    let list = e.target.result;
                    list.sort(sortByIndex);
                    folders.get(params.fid).onsuccess = (e)=>{
                        if(e.target.result!=null){
                            ret.folders.active = params.fid
                        }else{
                            ret.folders.active = list[0].id;
                            //setTimeout(strategy.getPosts({pid:list[0].id}))

                        }
                         ret.intent.push("renderFolders");
                         ret.folders.list = list;
                         resolve(ret);
                    }
                }
                //  folders.openCursor().onsuccess = function (e) {
                //      cursor = e.target.result;
                //      if (cursor) {
                //          if (cursor.key == params.fid) hit = true;
                //          list.push(cursor.value);
                //          cursor.continue();
                //      } else {
                //          list.sort(sortByIndex);
                //          if (hit) {
                //              ret.folders.active = params.fid
                //          } else {
                //              if (list.length == 0) reject(new Error("no folder exists!"));
                //              ret.folders.active = list[0].id;
                //          }
                //          ret.intent.push("renderFolders");
                //          ret.folders.list = list;
                //          resolve(ret);
                //      }

                //  }
             });

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
         return getDBobject(folder_name).then((folders)=>{
             return new Promise((resolve,reject)=>{
                 let req =  folders.delete(params.id);
                 req.onsuccess = (e)=>{
                     ret.intent.push("notify");
                     ret.info = "delete "+ params.id +"successfully!";
                     resolve(ret)
                  };
                  req.onerror = (e)=>{
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
     deleteFolder(params,ret){

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