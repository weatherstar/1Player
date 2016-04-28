var Background = Base.extend({

    playerInit: false,
    bitRate: 0,
    notificationShow: false,
    currentPageID:'',
    currentPort: null,
    songInfo: null,
    notificationDebounce: null,
    notificationInterval: null,
    clearNotificationTimeout: null,
    notificationTimeout: Config.default_notification_timeout,
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
                        self.sendMessageExtension(Events.INIT_PLAYER);
                        break;
                    case Events.SONG_CHANGE:
                        if(!self.isCurrentPage(port.name))return;
                        self.songInfo = msg.songInfo;
                        self.sendMessageExtension(Events.SONG_CHANGE);
                        self.notificationDebounce();
                        break;
                    case  Events.SONG_PROGRESS:
                        if(self.currentPageID != port.name){
                            self.currentPageID = port.name;
                            self.currentPort = port;
                        }
                        self.songInfo = msg.songInfo;
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
                        self.songLrc = msg.songLrc;
                        self.sendMessageExtension(Events.RESPONSE_SONG_LRC);
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
        chrome.notifications.onClosed.addListener(function () {
            self.notificationShow = false;
        });
        chrome.notifications.onClicked.addListener(function () {
            self.goPage('/song?id=' + self.songInfo.song_id);
        });
    },
    getOptions: function () {
        var self = this;
        chrome.storage.sync.get({
            notificationTimeout: Config.default_notification_timeout,
            bitRate: Config.default_bit_rate
        }, function(items) {
            self.notificationTimeout = items.notificationTimeout;
            self.bitRate = items.bitRate;
            self.sendMessageExtension(Events.BIT_RATE_CHANGE);
        });
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
    desktopNotify: function () {
        var self = this;
        var options = {
            type: "basic",
            title: Util.getElementText(self.songInfo.song_name),
            message: Util.getElementText(self.songInfo.singer_name),
            iconUrl: '../icon48.png'
        };
        clearInterval(self.notificationInterval);

        if(self.notificationTimeout == 0)return;

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
                if(self.notificationShow){
                    clearTimeout(self.clearNotificationTimeout);
                    chrome.notifications.update(self.notificationID, options, function () {
                        self.clearNotificationTimeout = setTimeout(function () {
                            chrome.notifications.clear(self.notificationID);
                        },self.notificationTimeout);
                    });
                }else{
                    chrome.notifications.create(self.notificationID = Util.now().toString(), options, function () {
                        self.clearNotificationTimeout = setTimeout(function () {
                            chrome.notifications.clear(self.notificationID);
                        },self.notificationTimeout);
                    });
                    self.notificationShow = true;
                }
            }
        },500);
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
        chrome.tabs.query({url:"http://music.163.com/*"}, function (tabs) {
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
            chrome.tabs.update(this.currentPort.sender.tab.id, {selected: true});
            this.sendMessageContent({type: Events.GO_PAGE, page: page});
        }else{
            chrome.tabs.create({ url: Config.music_163_url });
        }
    },
    //向content发送消息
    sendMessageContent: function (message) {
        this.currentPort.postMessage(message)
    },
    //在extension内部发送消息
    sendMessageExtension: function(message){
        chrome.extension.sendMessage(message);
    }
});

Background.init();
