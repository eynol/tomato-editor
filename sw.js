 //TODO: make it a server worker 


 var dbName = "toMat0",
     version = 3;




 var initFolders = [{
     id: "f" + Date.now(),
     name: "默认文件夹",
     index: 0
 }]

 var initPosts = [{
     id: "p1234",
     title: "How to Use",
     index: 0
 }]


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
     if (!db.objectStoreNames.contains("folders")) {

         let folders = db.createObjectStore("folders", {
             keyPath: "id"
         });

         folders.createIndex("id", "id", {
             unique: true
         });

         folders.createIndex("name", "name", {
             unique: true
         });

         folders.transaction.oncomplete = function (event) {
             // Store values in the newly created objectStore.
             var folders = db.transaction("folders", "readwrite").objectStore("folders");
             for (var i in initFolders) {
                 folders.add(initFolders[i]);
             }
         };
     }

     /**
      * posts
      */
     if (!db.objectStoreNames.contains("posts")) {

         let posts = db.createObjectStore("posts", {
             keyPath: "id"
         });

         posts.createIndex("id", "id", {
             unique: true
         });

         posts.createIndex("title", "title", {
             unique: true
         });

         posts.transaction.oncomplete = function (event) {
             // Store values in the newly created objectStore.
             var folders = db.transaction("posts", "readwrite").objectStore("posts");
             for (var i in initPosts) {
                 folders.add(initPosts[i]);
             }
         };
     }


     console.log(e);
 }

 var strategy = {

     getAllFolders: () => {
         return getDB().then((db) => {
             return new Promise(function (resolve,reject) {
                 let folders = db.transaction("folders", "readonly").objectStore("folders");
                 folders.openCursor().onsuccess = function (e) {
                     let cursor = e.target.result,
                         ret=[];
                     if (cursor) {
                         ret.push(cursor.value);
                         cursor.continue();
                     } else {
                         if(ret.length ==0)reject(new Error("no folder exists!"))
                     }
                     resolve(ret);
                 }
             });
         });
     },//get all folders

 }




 onmessage = function (msg) {
     let _msg = JSON.parse(msg.data);
     strategy[_msg.intent]().then(function (ret) {
         postMessage(JSON.stringify(ret));
     })

 }