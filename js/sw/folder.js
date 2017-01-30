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
                dbFolder
                    .getAll()
                    .onsuccess = (e) => {
                    let list = e.target.result;
                    list.sort(sortByIndex);
                    ret
                        .intent
                        .push("renderFolders");
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
                        let req = dbFolder4Index
                            .index("index")
                            .openKeyCursor(IDBKeyRange.only(0));
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
                folder
                    .get(params.id)
                    .onsuccess = (e) => {
                    let obj = e.target.result;
                    if (obj) 
                        obj.name = params.name;
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
        let fakeRet = {
            intent: []
        }
        return _Post
            ._getAllPost(params, fakeRet)
            .then((postRet) => {

                if (postRet.posts.list.length != 0) {
                    //do not delete post
                    ret
                        .intent
                        .push("deleteFolder");
                    ret.code = 1;
                    ret.info = "folder is not empity!";
                    return Promise.resolve(ret)
                } else {
                    //folder is empity, do delete
                    var _cursor;

                    return getDBobject(folder_name).then((folders) => {
                        return new Promise((resolve, reject) => {

                            let req1 = folders.openCursor();

                            req1.onsuccess = (e) => {
                                _cursor = e.target.result;
                                if (_cursor) {
                                    //we get the actived pid
                                    let f = _cursor.value;
                                    lg("f is ", f)
                                    if (f.index <= params.index) {
                                        _cursor.continue(); // pass;
                                    } else {
                                        lg("update index :")
                                        //update index
                                        folders
                                            .get(_cursor.key)
                                            .onsuccess = (e) => {
                                            lg("update index :", e.target)
                                            let f = e.target.result;
                                            f.index = f.index - 1;
                                            let req = folders.put(f);
                                            req.onsuccess = (e) => {
                                                _cursor.continue();
                                            }
                                            req.onerror = (e) => {
                                                reject(e)
                                            }
                                        }

                                    }

                                } else {
                                    // do delete
                                    lg("delete index :")
                                    let req2 = folders.delete(params.fid);
                                    req2.onsuccess = (e) => {
                                        //TODO update index after delete
                                        ret
                                            .intent
                                            .push("deleteFolder");
                                        ret.code = 0;
                                        ret.info = "delete folder(" + params.fid + ") successfully!";
                                        resolve(ret)

                                    };
                                    req2.onerror = (e) => {
                                        reject(e)
                                    }

                                }
                            }

                            req1.onerror = (e) => {
                                reject(e)
                            }
                        })
                    })
                }

            })

    },
    _updateIndex(params, ret) {
        return getDBobject(folder_name).then((folders) => {
            return new Promise((resolve, reject) => {
                let cursor;
                folders
                    .openCursor()
                    .onsuccess = (e) => {
                    cursor = e.target.result;
                    if (cursor) {

                        if (params[cursor.key] != undefined) {
                            folders
                                .get(cursor.key)
                                .onsuccess = (e) => {
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
                        ret
                            .intent
                            .push("notify");
                        ret.info = "success!";
                        resolve(ret)
                    }
                }
            })
        })
    }
};
