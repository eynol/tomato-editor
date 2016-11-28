define(['require', 'exports', 'module', 'watcher', 'dynamics'], function (require, exports, module, watcher, dynamics) {
    'use strict';
    var H = module.exports,
        lock_btn = watcher.$$("js-o-lock"),
        info_hub = watcher.$$("js-info-hub"),
        setting = watcher.$$("js-o-setting"),
        status = watcher.status,
        current_status={};


    H.init = () => {
        dom();
    }


    function dom() {
        lock_btn.addEventListener("click", (e) => {
            watcher.trigger("lockScreen");
        })
    }
    watcher.listen("statusChange", () => {
        if (current_status.mode == status.mode && current_status.saved == status.saved) {
            return;
        }
        current_status.mode = status.mode;
        current_status.saved = status.saved;

        var mode = status.mode == "both" ?
            "普通模式" :
            status.mode == "edit" ?
            "编辑模式" : "预览模式",
            saved = status.saved == true ? "已保存" : "编辑中"


        dynamics.animate(info_hub, {
            translateY: -40
        }, {
            duration: 300,
            complete: () => {
                info_hub.textContent = "[" + mode + ":" + saved + "]";

                dynamics.animate(info_hub, {
                    translateY: 0
                }, {
                    type: dynamics.spring,
                    duration: 500
                })
            }
        })


    })

});