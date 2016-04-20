var Background = Base.extend({

    playerInit: false,
    notificationShow: false,
    currentPageID:'',
    currentPort: null,
    songInfo: null,
    notificationDebounce: null,
    notificationInterval: null,
    inputEl: document.createElement('input'),
    defaultSongInfo: {
        "song_id": 0,
        "song_img": "./imgs/default_music_pic_163.jpeg",
        "song_name": "打开网易云音乐",
        "singer_id": 0,
        "singer_name": "",
        "loaded": 0,
        "played": 0,
        "time": "00:00 / 00:00",
        "playing": false,
        "play_type": 'loop'
    },

    afterInit: function () {
        document.body.appendChild(this.inputEl);
        this.songInfo = this.defaultSongInfo;
        this.notificationDebounce =  Util.debounce(this.desktopNotify,1000);
        this.listenContentMessage();
        this.listenCommands();
        this.listenNotification();
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
            title: self.songInfo.song_name,
            message: self.songInfo.singer_name,
            iconUrl: '../icon48.png'
        };
        clearInterval(self.notificationInterval);

        self.notificationInterval = setInterval(function () {
            if(self.songInfo.playing){
                clearInterval(self.notificationInterval);
                if(self.notificationShow){
                    chrome.notifications.update(self.notificationID, options);
                }else{
                    chrome.notifications.create(self.notificationID = Util.now().toString(), options);
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
