// ==UserScript==
// @name         网易云音乐高音质支持
// @version      3.0
// @description  去除网页版网易云音乐仅可播放低音质（96Kbps）的限制，强制播放高音质版本
// @match        *://music.163.com/*
// @include      *://music.163.com/*
// @author       864907600cc
// @icon         https://secure.gravatar.com/avatar/147834caf9ccb0a66b2505c753747867
// @run-at       document-start
// @grant        none
// @namespace    http://ext.ccloli.com
// ==/UserScript==
(function (window) {
    // getTrackURL 源码来自 Chrome 扩展程序 网易云音乐增强器(Netease Music Enhancement) by wanmingtom@gmail.com
    // 菊苣这个加密算法你是怎么知道的 _(:3
    var getTrackURL = function getTrackURL (dfsId) {
        var byte1 = '3' + 'g' + 'o' + '8' + '&' + '$' + '8' + '*' + '3'
            + '*' + '3' + 'h' + '0' + 'k' + '(' + '2' + ')' + '2';
        var byte1Length = byte1.length;
        var byte2 = dfsId + '';
        var byte2Length = byte2.length;
        var byte3 = [];
        for (var i = 0; i < byte2Length; i++) {
            byte3[i] = byte2.charCodeAt(i) ^ byte1.charCodeAt(i % byte1Length);
        }

        byte3 = byte3.map(function(i) {
            return String.fromCharCode(i)
        }).join('');

        results = CryptoJS.MD5(byte3).toString(CryptoJS.enc.Base64);
        results = results.replace(/\//g, '_').replace(/\+/g, '-');

        // 如果需要修改使用的 cdn，请修改下面的地址
        // 可用的服务器有 ['m1', 'm2', 'p1', 'p2']
        // 使用 p1 或 p2 的 cdn 可解决境外用户无法播放的问题
        var url = 'http://m1.music.126.net/' + results + '/' + byte2 + '.mp3';
        return url;
    };

    var modifyURL = function modifyURL(data, parentKey) {
        console.log('API 返回了 ' + data.length + ' 首曲目');
        console.log('施放魔法！变变变！');
        data.forEach(function(elem){
            // 部分音乐没有高音质
            if (!parentKey) elem.mp3Url = getTrackURL(elem.hMusic ? elem.hMusic.dfsId : elem.mMusic ? elem.mMusic.dfsId : elem.lMusic.dfsId);
            else elem[parentKey].mp3Url = getTrackURL(elem[parentKey].hMusic ? elem.hMusic[parentKey].dfsId : elem[parentKey].mMusic ? elem.mMusic[parentKey].dfsId : elem.lMusic[parentKey].dfsId);
        });
        return data;
    };

    var cachedURL = {};
    var qualityNode = null;

// 重新编写脚本，改用 hook xhr 的形式替换 URL 链接
    var originalXMLHttpRequest = window.XMLHttpRequest;
    var fakeXMLHttpRequest = function(){
        debugger
        var __this__ = this;
        var _this = new originalXMLHttpRequest();
        var _this_proto = _this.constructor.prototype;
        Object.keys(originalXMLHttpRequest).forEach(function(elem){
            if (typeof originalXMLHttpRequest[elem] === 'function') {
                __this__[elem] = function(){
                    _this[elem].apply(_this, arguments);
                };
            }
            else {
                var property = {};
                var originalProperty = Object.getOwnPropertyDescriptor(originalXMLHttpRequest, elem);
                property.get = function(){ return _this[elem]; };
                if (originalProperty.set) property.set = function(val){ return _this[elem] = val; };
                Object.defineProperty(__this__, elem, property);
            }
        });
        Object.keys(_this_proto).forEach(function(elem){
            if (elem in __this__) return;
            if (elem === 'responseText') return;
            if (typeof _this[elem] === 'function') {
                if (elem === 'open') { // add requestURL support
                    __this__[elem] = function(){
                        //console.log(elem, arguments);
                        if (arguments[1].indexOf('/enhance/player/') >= 0) {
                            // 对新版 api 请求旧的 api 接口
                            __this__.ping = new fakeXMLHttpRequest();
                            __this__.ping.open(arguments[0], arguments[1].replace('/enhance/player/url', '/detail'), false); // 不使用异步 xhr 以阻断原 xhr 请求
                            __this__.ping.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                        }
                        _this[elem].apply(_this, arguments);
                        __this__.requestURL = arguments[1];
                        /*
                         if (arguments[1].indexOf('/enhance/player/')) {
                         arguments[1] = arguments[1].replace('/enhance/player/url', '/detail');
                         }*/
                    };
                }
                else if (elem === 'send') { // add requestURL support
                    __this__[elem] = function(){
                        //console.log(elem, arguments);
                        //console.log(__this__.ping);
                        if (__this__.requestURL.indexOf('/enhance/player/') >= 0 && __this__.ping) {
                            //__this__.ping.send(arguments[0]);
                            __this__.ping.sendData = arguments[0];
                        }
                        _this[elem].apply(_this, arguments);
                    };
                }
                else {
                    __this__[elem] = function(){
                        //console.log(elem, arguments);
                        _this[elem].apply(_this, arguments);
                    };
                }
            }
            else {
                var property = {};
                var originalProperty = Object.getOwnPropertyDescriptor(_this_proto, elem);
                property.get = function(){ /*console.log(elem);*/ return _this[elem]; };
                if (originalProperty.set) property.set = function(val){ return _this[elem] = val; };
                Object.defineProperty(__this__, elem, property);
            }
        });
        Object.defineProperty(__this__, 'responseText', {
            get: function(){
                //console.log(_this.responseText);
                //console.log('Request URL: ' + __this__.requestURL);
                try {
                    if (__this__.requestURL.indexOf('/weapi/') < 0 && __this__.requestURL.indexOf('/api/') < 0) return _this.responseText;
                    var action = __this__.requestURL.split(/\/(?:we)?api\//)[1].split('?')[0].split('/');
                    switch (action[0]) {
                        case 'album':
                            var res = JSON.parse(_this.responseText);
                            modifyURL(res.album.songs);
                            return JSON.stringify(res);
                            break;
                        case 'song':
                            if (action[1] !== 'detail') {
                                if (action[1] !== 'enhance' && action[2] !== 'player' && action[3] !== 'url') return _this.responseText;
                                var res = JSON.parse(_this.responseText);

                                // 因为新版 API 已经返回的是高音质版本，所以不需要再请求旧的 API
                                // 如果返回地址为 null 再尝试获取旧版 API
                                if (res.data[0].url) {
                                    cachedURL[res.data[0].id] = res.data[0].url;
                                    delete __this__.ping;
                                    qualityNode.textContent = (res.data[0].br) / 1000 + 'K';
                                    return _this.responseText;
                                }

                                //if (__this__.ping) res.data[0].url = JSON.parse(__this__.ping.responseText).songs[0].mp3Url; // 替换旧版 api 的 url
                                if (!cachedURL[res.data[0].id]) { // 若未缓存再请求原始 api
                                    __this__.ping.send(__this__.ping.sendData);
                                    cachedURL[res.data[0].id] = JSON.parse(__this__.ping.responseText).songs[0].mp3Url;
                                }
                                res.data[0].url = cachedURL[res.data[0].id];
                                return JSON.stringify(res);
                            }
                            var res = JSON.parse(_this.responseText);
                            modifyURL(res.songs);
                            if (qualityNode) {
                                qualityNode.textContent = (res.songs[0].hMusic ? res.songs[0].hMusic.bitrate : res.songs[0].mMusic ? res.songs[0].mMusic.bitrate : res.songs[0].lMusic.bitrate) / 1000 + 'K';
                            }
                            return JSON.stringify(res);
                            break;
                        case 'playlist':
                            if (action[1] !== 'detail') return _this.responseText;
                            var res = JSON.parse(_this.responseText);
                            modifyURL(res.result.tracks);
                            return JSON.stringify(res);
                            break;
                        case 'dj':
                            if (action[2] === 'byradio') {
                                var res = JSON.parse(_this.responseText);
                                modifyURL(res.programs, 'mainSong');
                                return JSON.stringify(res);
                            }
                            else if (action[2] === 'detail') {
                                var res = JSON.parse(_this.responseText);
                                res.program = modifyURL([res.program], 'mainSong')[0];
                                return JSON.stringify(res);
                            }
                            else return _this.responseText;
                            break;
                        case 'radio':
                            if (action[1] === 'get') {
                                var res = JSON.parse(_this.responseText);
                                modifyURL(res.data);
                                return JSON.stringify(res);
                            }
                            else return _this.responseText;
                            break;
                        case 'v3':
                            switch (action[1]){
                                // http://music.163.com/weapi/v3/playlist/detail
                                case 'playlist':
                                    if (action[2] !== 'detail') return _this.responseText;
                                    var res = JSON.parse(_this.responseText);
                                    res.privileges.forEach(function(elem){
                                        var q = elem.pl || elem.dl || elem.fl || Math.min(elem.maxbr, 320000) || 320000;
                                        elem.st = 0;
                                        elem.pl = q;
                                        elem.dl = q;
                                        elem.fl = q;
                                    });
                                    if (res.privileges.length < res.playlist.trackIds.length && res.playlist.trackIds.length === res.playlist.tracks.length) {
                                        // 对超过 1000 的播放列表补充播放信息（需魔改 core.js）
                                        for (var i = res.privileges.length; i < res.playlist.trackIds.length; i++) {
                                            var q = res.playlist.tracks.h ? res.playlist.tracks.h.br : res.playlist.tracks.m ? res.playlist.tracks.m.br : res.playlist.tracks.l ? res.playlist.tracks.l.br : res.playlist.tracks.a ? res.playlist.tracks.a.br : 320000;
                                            res.privileges.push({
                                                cp: 1,
                                                cs: false,
                                                dl: q,
                                                fee: 0,
                                                fl: q,
                                                id: res.playlist.trackIds[i].id,
                                                maxbr: q,
                                                payed: 0,
                                                pl: q,
                                                sp: 7,
                                                st: 0,
                                                subp: 1
                                            });
                                        }
                                    }
                                    //console.log(res);
                                    return JSON.stringify(res);
                                    break;
                                case 'song':
                                    if (action[2] !== 'detail') return _this.responseText;
                                    var res = JSON.parse(_this.responseText);
                                    res.privileges.forEach(function(elem){
                                        var q = elem.pl || elem.dl || elem.fl || Math.min(elem.maxbr, 320000) || 320000;
                                        elem.st = 0;
                                        elem.pl = q;
                                        elem.dl = q;
                                        elem.fl = q;
                                    });
                                    return JSON.stringify(res);
                                    break;
                                default:
                                    return _this.responseText;
                            }
                            break;
                        default:
                            return _this.responseText;
                    }
                }
                catch (error) {
                    // 以防 api 转换失败也能正常返回数据
                    console.error('转换出错！', error);
                    return _this.responseText;
                }
            }
        });
        this.originalXMLHttpRequest = _this;
    };
// 旧版 API 大部分曲目失效，故 hook 加密函数以获取新版 API 的高音质版本
    var bit_rate;
    var original_asrsea;
    var fake_asrsea = function(){
        //console.log(arguments)
        var data = JSON.parse(arguments[0]);
        if (data.br && data.br === 128000) {
            data.br = 320000;
            arguments[0] = JSON.stringify(data);
        }
        //console.log(arguments);
        return original_asrsea.apply(window, arguments);
    };
    if (window.asrsea) {
        original_asrsea = window.asrsea;
    }
    else {
        Object.defineProperty(window, 'asrsea', {
            get: function(){
                return fake_asrsea;
            },
            set: function(val) {
                //console.log(val);
                original_asrsea = val;
            }
        });
    }
    document.querySelector('#bit-rate').addEventListener('click', function (e) {
        var bitRate = this.getAttribute('data-bit');
        if(bitRate == 96){
            window.asrsea = original_asrsea;
        }else if(bitRate == 320){
            window.asrsea = fake_asrsea;
        }
    });
})(window);
