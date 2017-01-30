const _Content = {
    _getContent(params, ret) {
        return getDBobject(content_name).then((dbContent) => {
            return new Promise((resolve, reject) => {

                let req = dbContent
                    .index("pid")
                    .openCursor(IDBKeyRange.only(params.pid));
                req.onsuccess = (e) => {

                    let content = e.target.result;
                    if (content) {
                        ret.content = content.value
                    } else {
                        ret.content = ""
                    }
                    ret
                        .intent
                        .push("renderContent");
                    resolve(ret)
                }
                req.onerror = (e) => {
                    reject(e)
                }
            })
        })
    },
    _updateContent(params, ret) {
        return getDB().then((db) => {
            let transaction = db.transaction([
                content_name, post_name
            ], "readwrite");
            return new Promise((resolve, reject) => {
                lg("update content of pid:" + params.pid)
                let dbContent = transaction.objectStore(content_name),
                    dbPost = transaction.objectStore(post_name),
                    req = dbContent
                        .index("pid")
                        .openCursor(IDBKeyRange.only(params.pid));

                req.onsuccess = (e) => {
                    let cursor = e.target.result,
                        okCb = (e) => {
                            // well, if we update content successfully,we have to update post info; we
                            // define the update post function to update post infomation
                            _Post
                                ._whenUpdContent(params, dbPost)
                                .then(() => {
                                    ret
                                        .intent
                                        .push("notify");
                                    ret
                                        .intent
                                        .push("saveContentSuccess");
                                    ret.info = "更新内容成功";
                                    ret.params = params
                                    resolve(ret)
                                })
                        };
                    if (cursor) {
                        //if the content  exist
                        let content = cursor.value;
                        content.value = params.value
                        dbContent
                            .put(content)
                            .onsuccess = okCb;
                    } else {
                        // post did not have  content,we have to create it
                        let newContent = {
                            id: "c" + Date.now(),
                            pid: params.pid,
                            value: params.value
                        }
                        dbContent
                            .add(newContent)
                            .onsuccess = okCb;
                    }

                }
                req.onerror = (e) => {
                    lg("error in update content :%O", e)
                    reject(e)
                }
            })
        })
    },
    _deleteContent(params, ret) {
        return getDB().then((db) => {
            let transaction = db.transaction([
                content_name, post_name
            ], "readwrite");
            let dbContent = transaction.objectStore(content_name);
            dbPost = transaction.objectStore(post_name);

            return new Promise((resolve, reject) => {

                let req = dbContent
                    .index("pid")
                    .openCursor(IDBKeyRange.only(params.pid));
                req.onsuccess = (e) => {
                    let cursor = e.target.result;
                    if (cursor) {
                        let req2 = dbContent.delete(cursor.key)
                        req2.onsuccess = (e) => {
                            ret.dbPost = dbPost;
                            ret.code = 0;
                            ret.info = "delete content(" + params.pid + ") successful!";
                            resolve(ret)
                        }
                        req.onerror = () => {
                            reject(e)
                        }
                    } else {
                        ret.dbPost = dbPost;
                        ret.code = 0;
                        ret.info = "no content(" + params.pid + ") ~";
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
