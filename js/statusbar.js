define(['require', 'exports', 'module', 'watcher'], function (require, exports, module, watcher) {
    'use strict';
    var B = module.exports,
        battery = watcher.$$("js-battery"),
        battery_fa = battery.firstElementChild,
        time = watcher.$$("js-time-bar"),
        batteryStatus = {
            timer: undefined,
            level: undefined,
            charging: undefined,
            index: 0,
            updateStatus:  function () {
                clearInterval(this.timer);
                if (this.charging) {
                    battery_fa.setAttribute("title", "Charging," + (this.level * 100) + "%")
                    this.timer = setInterval(() => {
                        battery_fa.className = "fa fa-battery-" + this.index;
                        if (this.index >= 4) this.index = 0;
                        else ++this.index;
                    }, 1000);
                } else {
                    battery_fa.setAttribute("title", "" + (this.level * 100) + "%")
                    battery_fa.className = this.getBatteryClass(this.level);
                }
            },
            getBatteryClass: function(level)  {
                if (level > 0.98) return "fa fa-battery-4";
                return "fa fa-battery-" + Math.floor((level * 100) / 20);
            }
        };




    B.init = () => {
        bindBatteryManager();
        setInterval(() => {
            var now = new Date(),
                hour = now.getHours(),
                minute = now.getMinutes();
            time.innerText = hour + ":" + minute;
            time.setAttribute("title", now.toLocaleTimeString())

        }, 999)
    }

    function bindBatteryManager() {
        if (navigator.getBattery) {
            navigator.getBattery().then((BM) => {
                batteryStatus.level = BM.level;
                batteryStatus.charging = BM.charging;
                batteryStatus.updateStatus();
                BM.onchargingchange = (e) => {
                    batteryStatus.charging = e.target.charging;
                    batteryStatus.updateStatus();
                    console.log("charging change:", battery_fa);

                }
                BM.onlevelchange = (e) => {
                    batteryStatus.level = e.target.level;
                    batteryStatus.updateStatus();
                    console.log("level change", battery_fa);
                }
            })
        } else {
            battery.parentElement.removeChild(battery);
        }
    }


    B.hideStatus =  ()=> {
        battery.style.display = "none";
        time.style.display = "none";
    }
    B.showStatus =  () =>{
        battery.style.display = "inline";
        time.style.display = "inline";
    }



    watcher.listen("fullScreen", B.showStatus);
    watcher.listen("exitFullScreen", B.hideStatus);

});