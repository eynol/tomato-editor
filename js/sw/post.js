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

            let req = dbPost
              .index("fid")
              .getAll(IDBKeyRange.only(fid));
            req.onsuccess = (e) => {
              let list = e.target.result;
              lg("getAllPost:private function:_get_posts_by_fid :" + fid)
              list.sort(sortByIndex);
              ret.posts.list = list;
              //ret.posts.active = pid; do not resolve the active
              ret
                .intent
                .push("renderPosts");
              _resolve(ret)
            }

            req.onerror = (e) => {
              _reject(e);
            }
          })

        }).then((_ret) => {
          lg("getAllPost:resolve pid's problem before ret:%O", _ret)
          //in this promise ,we solve the pid's problem
          if (pid != null && pid != undefined) {
            _ret.posts.active = pid;
            return Promise.resolve(_ret);
          } else {
            return new Promise((_resolve, _reject) => {
              //let's  get the post who's index equals 0
              getDBobject(post_name, "readonly").then((dbPost4index) => {
                let req = dbPost4index
                  .index("index")
                  .openCursor(IDBKeyRange.only(0));
                req.onsuccess = (e) => {
                  let _cursor = e.target.result;

                  if (_cursor) {
                    //we get the actived pid
                    if (_cursor.value.fid == params.fid) {

                      _ret.posts.active = _cursor.value.id;

                      lg("getAllPost:resolve pid's problem after ret:%O", _ret)
                      _resolve(_ret);
                    } else {
                      _cursor.continue();
                    }
                  } else {
                    //  _reject(new Error("no post index equals 0 ,the posts' index is messed"))

                    lg("getAllPost:no post index equals 0 ,ret:%O", _ret)
                    _resolve(_ret);
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
        // first time we should get the folder's fid (index == 0),and then get all
        // posts. Then active the post(index == 0)
        getDBobject(folder_name, "readonly")
          .then(function (folderdb) {
            let index = folderdb.index("index"),
              range = IDBKeyRange.only(0);
            index
              .openKeyCursor(range)
              .onsuccess = (e) => {
              let fid = e.target.result.primaryKey;
              //we get the fid and then solve it in  normal way,
              resolve(_get_posts_by_fid(fid, params.pid))
            }
          })

      } else {
        //fid is not null let's use it
        lg("getAllPost:fid is not null %o", params);
        resolve(_get_posts_by_fid(params.fid, params.pid))
      }

    });

  },
  _newPost(params, ret) {
    //once new a post all of posts' index will plus 1,then we add the new post
    return getDBobject(post_name).then((dbPost) => {
      return new Promise((resolve, reject) => {
        let req = dbPost
            .index("fid")
            .openCursor(IDBKeyRange.only(params.fid)),
          func_error = (e) => {
            reject(e)
          };
        req.onsuccess = (e) => {
          let cursor = e.target.result;
          if (cursor) {
            let post = cursor.value;
            post.index += 1;
            dbPost
              .put(post)
              .onsuccess = (e) => {
              cursor.continue();
            }
          } else {
            dbPost
              .add(params)
              .onsuccess = (e) => {
              resolve(params)
            }
          }
        }
        req.onerror = func_error;
      })
    })
  },
  _deletePost(params, ret) {
    return new Promise((resolve, reject) => {
      _Content
        ._deleteContent(params, ({}))
        .then((contRet) => {
          if (contRet.code == 0) {
            //delete content successful
            let dbPost = contRet.dbPost;

            dbPost
              .index("fid")
              .openCursor(IDBKeyRange.only(params.fid))
              .onsuccess = (e) => {
              let cursor = e.target.result;
              if (cursor) {
                let post = cursor.value;
                if (post.index <= params.index) {
                  cursor.continue();
                } else {
                  //update post
                  dbPost
                    .get(cursor.key)
                    .onsuccess = (e) => {
                    let p = e.target.result;
                    p.index = p.index - 1;
                    let req = dbPost.put(p);
                    req.onsuccess = (e) => {
                      cursor.continue();
                    }
                    req.onerror = (e) => {
                      reject(e);
                    }
                  }
                }
              } else {
                //do delete
                let req = dbPost.delete(params.pid);
                req.onsuccess = (e) => {
                  lg("delete post %O", e)
                  //TODO update index after delete
                  ret
                    .intent
                    .push("deletePost");
                  ret.code = 0;
                  ret.info = "delete post(" + params.pid + ") successful~";
                  resolve(ret);
                }
                req.onerror = (e) => {
                  reject(e);
                }
              }
            };

          } else {
            reject("Delete content faild,code is " + contRet.code);
          }
        })
        .catch((e) => {
          reject("Delete content faild due to request transaction error");
        })
    })
  },
  _updateIndex(params, ret) {
    return getDBobject(post_name).then((dbPost) => {
      return new Promise((resolve, reject) => {
        let cursor;
        dbPost
          .openCursor()
          .onsuccess = (e) => {
          cursor = e.target.result;
          if (cursor) {

            if (params[cursor.key] != undefined) {
              dbPost
                .get(cursor.key)
                .onsuccess = (e) => {
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
            ret
              .intent
              .push("notify");
            ret.info = "success!";
            resolve(ret)
          }
        }
      })
    })
  },
  _whenUpdContent(params, dbPost) {
    return new Promise((resolve, reject) => {
      if (!params.pid) 
        reject("pid is undefined");
      dbPost
        .get(params.pid)
        .onsuccess = (e) => {

        let post = e.target.result;
        post.brief = params.brief
        post.modified = params.modified;

        dbPost
          .put(post)
          .onsuccess = (e) => {
          resolve("ok");
        }
      }
      dbPost.onerror = (e) => {
        reject(e);
      }

    })

  },
  _updateTitle(params, ret) {
    return new Promise((resolve, reject) => {
      getDBobject(post_name).then((dbPost) => {
        dbPost
          .get(params.pid)
          .onsuccess = (e) => {
          let post = e.target.result;
          post.title = params.title || "";
          dbPost
            .put(post)
            .onsuccess = (e) => {
            ret
              .intent
              .push("notify");
            ret.info = "update title success!";
            resolve(ret)
          }
        }
      }).catch(() => {
        reject("update failed");
      })
    })
  }
}
