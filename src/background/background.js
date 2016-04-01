var Background = Base.extend({

    playerInit: false,
    currentPageID:'',
    currentPort: null,
    songInfo: null,
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
        this.songInfo = this.defaultSongInfo;
        this.listenContentMessage();
        this.listenCommands();
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
    playOrPause: function () {
        this.sendMessageContent({type: Events.STATE_CHANGE});
    },
    changeTime: function(percent){
        this.sendMessageContent({type: Events.TIME_CHANGE, percent: percent});
    },
    changeContentPlayType: function () {
         this.sendMessageContent({type: Events.PLAY_TYPE_CHANGE});
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
