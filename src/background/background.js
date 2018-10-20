var Background = Base.extend({

    MAX_LRC_NOTIFICATION: 2,
    LRC_INTERVAL: 500,
    ADD_LIKE_MAX_TIME: 6000,

    playerInit: false,
    songTime:'',
    songLrc: '',
    addLikeMsg: '',
    isLogin: false,
    loadingLike: false,
    songNotificationID: 'songNotification',
    lrcNotificationID: 'lrcNotification',
    currentPageID:'',
    currentPort: null,
    songInfo: {},
    currentLrc: {},
    options: {},
    notificationDebounce: null,
    notificationInterval: null,
    clearNotificationTimeout: null,
    inputEl: document.createElement('input'),
    defaultSongInfo: {
        "song_id": 0,
        "song_img": "./imgs/default_music_pic_163.jpg",
        "song_name": "打开网易云音乐",
        "singer_id": 0,
        "singer_name": "网易云音乐",
        "loaded": 0,
        "played": 0,
        "time": "00:00 / 00:00",
        "playing": false,
        "play_type": 'loop',
        "volume": 0
    },

    afterInit: function () {
        document.body.appendChild(this.inputEl);
        this.songInfo = this.defaultSongInfo;
        this.notificationDebounce =  Util.debounce(this.desktopNotify,1000);
        this.listenContentMessage();
        this.listenCommands();
        this.listenNotification();
        this.getOptions();
        this.initLrcInterval();
    },
    initLrcInterval: function () {
        var self = this;
      setInterval(function () {
          if(self.songInfo.playing){
              self.getSongTime();
          }
      },self.LRC_INTERVAL);
    },
    listenCommands: function () {
        var self = this;
        chrome.commands.onCommand.addListener(function (command) {
            switch (command){
                case 'play-next':
                    self.playNext();
                    break;
                case 'play-prev':
                    self.playPrev();
                    break;
                case 'play-or-pause':
                    self.playOrPause();
                    break;
                case 'copy-song':
                    self.copySongLinkToClipboard();
                    break;
                case 'add-like':
                    self.addToLike();
            }
        });
    },
    listenContentMessage: function () {
        var self = this;
        chrome.runtime.onConnect.addListener(function(port) {
            port.onMessage.addListener(function(msg) {
                switch (msg.type) {
                    case Events.INIT_PLAYER:
                        if (self.playerInit) return;
                        self.playerInit = true;
                        self.currentPort = port;
                        self.currentPageID = port.name;
                        self.songInfo = msg.songInfo;
                        self.isLogin = msg.isLogin;
                        self.sendMessageExtension(Events.INIT_PLAYER);
                        break;
                    case Events.SONG_CHANGE:
                        if(!self.isCurrentPage(port.name))return;
                        self.songInfo = msg.songInfo;
                        self.isLogin = msg.isLogin;
                        self.sendMessageExtension(Events.SONG_CHANGE);
                        self.songLrc = '';
                        self.getSongLrc();
                        self.notificationDebounce();
                        break;
                    case  Events.SONG_PROGRESS:
                        if(self.currentPageID != port.name){
                            self.currentPageID = port.name;
                            self.currentPort = port;
                        }
                        self.songInfo = msg.songInfo;
                        self.isLogin = msg.isLogin;
                        self.sendMessageExtension(Events.SONG_PROGRESS);
                        break;
                    case  Events.SONG_PAUSE:
                        self.songInfo.playing = false;
                        self.sendMessageExtension(Events.SONG_PAUSE);
                        break;
                    case Events.PLAY_TYPE_CHANGE:
                        self.songInfo.play_type = msg.playType;
                        self.sendMessageExtension(Events.PLAY_TYPE_CHANGE);
                        break;
                    case Events.RESPONSE_SONG_LIST:
                        self.songList = msg.songList;
                        self.sendMessageExtension(Events.RESPONSE_SONG_LIST);
                        break;
                    case Events.RESPONSE_SONG_LRC:
                        self.songLrc = Util.getElementWrap(msg.songLrc);
                        self.sendMessageExtension(Events.RESPONSE_SONG_LRC);
                        break;
                    case Events.ADD_LIKE_FINISH:
                        self.addLikeMsg = msg.msg;
                        self.loadingLike = false;
                        clearTimeout(self.addLikeTimeout);
                        self.showAddLikeFinishNotification();
                        self.sendMessageExtension(Events.ADD_LIKE_FINISH);
                        break;
                    case Events.RESPONSE_SONG_TIME:
                        self.songTime = msg.time;
                        self.sendMessageExtension(Events.RESPONSE_SONG_TIME);
                        if(self.isShowDesktopLrc()){
                            self.changeLrc();
                        }
                        break;
                }
            });
            port.onDisconnect.addListener(function (port) {
                if(port.name == self.currentPageID){
                    self.reset();
                    self.sendMessage(Events.RESET_PLAYER);
                }
            })
        });
    },

    listenNotification: function () {
        var self = this;
        chrome.notifications.onClicked.addListener(function () {
            self.goPage('/song?id=' + self.songInfo.song_id);
        });
    },
    getOptions: function () {
        var self = this;
        chrome.storage.sync.get(Config.options, function(options) {
            self.options = options;
            self.sendMessageExtension(Events.BIT_RATE_CHANGE);
        });
    },
    setOptions: function (options) {
        var self = this;
        chrome.storage.sync.set(options, function() {
            self.getOptions();
        });
    },
    getSongTime: function () {
        this.sendMessageContent({type: Events.GET_SONG_TIME});
    },
    isShowDesktopLrc: function () {
        return this.options.desktopLrc === 'show';
    },
    changeLrc: function () {
        var seconds = Util.getProgressInSeconds(this.songTime.split('/')[0].split(':'));
        var lrcItem = null;
        lrcItem = this.songLrc.querySelector('[data-time^="' + seconds +'."]') || this.songLrc.querySelector('[data-time="' + seconds +'"]');
        if(lrcItem){
            if(Util.trim(lrcItem.innerText) === ''){
                this.songLrc.removeChild(lrcItem);
                return;
            }
            if(lrcItem.innerText != this.currentLrc.innerText){
                this.showLrcNotification(lrcItem.innerHTML);
            }
            this.currentLrc = lrcItem;
        }
    },
    isCurrentPage: function (name) {
        return this.currentPageID == name;
    },
    reset: function () {
        this.playerInit = false;
        this.currentPageID = '';
        this.currentPort = null;
        this.songInfo = this.defaultSongInfo;
    },
    playNext: function () {
      this.sendMessageContent({type: Events.NEXT});
    },
    playPrev: function () {
        this.sendMessageContent({type: Events.PREV});
    },
    showWarningNotification: function (title,message) {
        var options = {
            type: "basic",
            title: title || '',
            message: message || '',
            iconUrl: '../imgs/icon-warning.png'
        };
        this.showSongNotification(options);
    },
    showAddLikeFinishNotification: function () {
        var self = this;
        var iconUrl = self.addLikeMsg === Config.music_163_add_like_success_msg ? '../imgs/icon-success.png' : '../imgs/icon-warning.png';
        var options = {
            type: "basic",
            title: self.addLikeMsg,
            message: '',
            iconUrl: iconUrl
        };
        self.showSongNotification(options);
    },
    showLrcNotification: function (lrc) {

        var lrcArray = lrc.toString().split('<br>');
        var options = {
            type: "basic",
            title: lrcArray[0] ? (Util.getElementText(lrcArray[0]) || '') : '',
            message: lrcArray[1] ? (Util.getElementText(lrcArray[1]) || '') : '',
            iconUrl: '../icon128.png'
        };
        chrome.notifications.create(new Date().getTime().toString(), options);
    },
    desktopNotify: function () {
        var self = this;
        var options = {
            type: "basic",
            title: Util.getElementText(self.songInfo.song_name),
            message: Util.getElementText(self.songInfo.singer_name),
            iconUrl: '../icon128.png'
        };
        clearInterval(self.notificationInterval);

        if(self.options.notificationTimeout == 0)return;

        var xhr = new XMLHttpRequest();
        xhr.open("GET", self.songInfo.song_img);
        xhr.responseType = "blob";
        xhr.onload = function(){
            var blob = this.response;
            options.iconUrl = window.URL.createObjectURL(blob);
        };
        xhr.send(null);

        self.notificationInterval = setInterval(function () {
            if(self.songInfo.playing){
                clearInterval(self.notificationInterval);
                self.showSongNotification(options);
            }
        },500);
    },
    showSongNotification: function (options) {
        chrome.notifications.create(options)
    },
    copySongLinkToClipboard: function () {
        if(this.currentPort){
            this.inputEl.value = Config.music_163_url + '#/song?id=' + this.songInfo.song_id;
            this.inputEl.select();
            document.execCommand('copy');
        }
    },
    playOrPause: function () {
        var self = this;
        if(!self.currentPort){
            self.goPage();
            return;
        }
        //如果当前是播放mv的界面 先跳转至歌曲界面再播放
        if(!self.songInfo.isPlaying){
            self.isMVPage(function (mvPage) {
                mvPage && self.goPage('/song?id='+ self.songInfo.song_id);
            });
        }
        this.sendMessageContent({type: Events.STATE_CHANGE});
    },
    isMVPage: function (callback) {
        var self = this;
        callback = callback || Util.noop;
        chrome.tabs.query({url:"https://music.163.com/*"}, function (tabs) {
            tabs.forEach(function (tab) {
                if(tab.id = self.currentPort.sender.tab.id){
                    callback(/http:\/\/music\.163\.com\/\#\/mv\?id=\d+/gi.test(tab.url));
                }
            });
        });
    },
    getSongLrc: function () {
        this.sendMessageContent({type: Events.REQUEST_SONG_LRC});
    },
    changeVolume: function (percent) {
        this.sendMessageContent({type: Events.VOLUME_CHANGE, percent: percent});
    },
    changeTime: function(percent){
        this.sendMessageContent({type: Events.TIME_CHANGE, percent: percent});
    },
    addToLike: function(){
        var self = this;
        if(this.loadingLike)return;
        if(!this.playerInit)return;
        if(!this.isLogin){
            this.showWarningNotification('请先到网页端登录');
            return;
        }
        this.loadingLike = true;
        this.sendMessageExtension(Events.ADD_LIKE_START);
        this.sendMessageContent({type: Events.ADD_TO_LIKE});
        this.addLikeTimeout = setTimeout(function () {
            self.loadingLike = false;
            self.sendMessageExtension(Events.ADD_LIKE_FINISH);
        },self.ADD_LIKE_MAX_TIME)
    },
    changeContentPlayType: function () {
        this.sendMessageContent({type: Events.PLAY_TYPE_CHANGE});
    },
    requestSongList: function () {
        this.sendMessageContent({type: Events.REQUEST_SONG_LIST});
    },
    clickSongListItem: function (id) {
        this.sendMessageContent({type: Events.CLICK_SONG_LIST_ITEM, id: id})
    },
    goPage: function (page) {
        if(this.currentPort){
            chrome.windows.update(this.currentPort.sender.tab.windowId,{focused: true});
            chrome.tabs.update(this.currentPort.sender.tab.id, {selected: true});
            if(page){
                this.sendMessageContent({type: Events.GO_PAGE, page: page});
            }
        }else{
            chrome.tabs.create({ url: Config.music_163_url });
        }
    },
    //向content发送消息
    sendMessageContent: function (message) {
        this.currentPort && this.currentPort.postMessage(message)
    },
    //在extension内部发送消息
    sendMessageExtension: function(message){
        chrome.extension.sendMessage(message);
    }
});

Background.init();
