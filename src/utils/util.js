(function (_window) {
    _window.Util = {
        generateUUID: function (){
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (d + Math.random()*16)%16 | 0;
                d = Math.floor(d/16);
                return (c=='x' ? r : (r&0x7|0x8)).toString(16);
            });
            return uuid;
        },
        getElementText: function (text) {
            var div = document.createElement('div');
            div.innerHTML = text;
            return div.innerText;
        },
        getElementWrap: function (text) {
            var div = document.createElement('div');
            div.innerHTML = text;
            return div;
        },
        getProgressInSeconds: function(source_time){
            var time = source_time;
            var minutes = parseInt(time[0]);
            var seconds = parseInt(time[1]);
            return minutes * 60 + seconds;
        },
        observeDOM: (function(){
            var MutationObserver = _window.MutationObserver || _window.WebKitMutationObserver,
                eventListenerSupported = _window.addEventListener;

            return function(obj, callback){
                if( MutationObserver ){
                    var obs = new MutationObserver(function(mutations, observer){
                        if( mutations[0].addedNodes.length || mutations[0].removedNodes.length )
                            callback();
                    });
                    obs.observe( obj, { childList:true, subtree:true });
                }
                else if( eventListenerSupported ){
                    obj.addEventListener('DOMNodeInserted', callback, false);
                    obj.addEventListener('DOMNodeRemoved', callback, false);
                }
            }
        })(),
        injectScript: function(file,node){
            var th = document.getElementsByTagName(node)[0];
            var s = document.createElement('script');
            s.setAttribute('type', 'text/javascript');
            s.setAttribute('src', file);
            th.appendChild(s);
        },
        now: Date.now || function() {
            return new Date().getTime();
        },
        debounce: function(func, wait, immediate) {
            var self = this;
            var timeout, args, context, timestamp, result;

            var later = function() {
                // 据上一次触发时间间隔
                var last = self.now() - timestamp;

                // 上次被包装函数被调用时间间隔last小于设定时间间隔wait
                if (last < wait && last > 0) {
                    timeout = setTimeout(later, wait - last);
                } else {
                    timeout = null;
                    // 如果设定为immediate===true，因为开始边界已经调用过了此处无需调用
                    if (!immediate) {
                        result = func.apply(context, args);
                        if (!timeout) context = args = null;
                    }
                }
            };

            return function() {
                context = this;
                args = arguments;
                timestamp = self.now();
                var callNow = immediate && !timeout;
                // 如果延时不存在，重新设定延时
                if (!timeout) timeout = setTimeout(later, wait);
                if (callNow) {
                    result = func.apply(context, args);
                    context = args = null;
                }

                return result;
            };
        },
        noop: function(){}
    }
})(window);
