(function (_window) {
    var Content = Base.extend({

        MUSIC_163_PLAYER_ID: '#g_player',
        UNIQUE_ID: '',
        CHECK_MUSIC_CHANGE_DELAY: 500,
        CHECK_INIT_DELAY: 1000,


        playerInit: false,
        isPlaying: '',
        currentSongID: '',
        connectPort: '',
        playType: {
            "随机":"shuffle",
            "单曲循环":"loop-one",
            "循环":"loop"
        },

        events: {
            'click .ply': 'changePlayState'
        },
        afterInit: function () {
            var self = this;
            self.getPageUniqueID();
            self.checkPlayerInit(function () {
                self.playerInit = true;
                self.connectWithExtension();
                self.sendInitMessage();
                self.listenMusicChange();
            });
            self.bindOtherEvents();

        },
        listenMusicChange: function () {
            var self = this;
            var songID = '';
            setInterval(function () {
                self.refreshPlayState();
                self.sendSongProgressMessage();
                songID = self.getSongID();
                if(songID != self.currentSongID){
                    self.currentSongID = songID;
                    self.sendSongChangeMessage();
                }
            }, self.CHECK_MUSIC_CHANGE_DELAY);
        },
        sendSongProgressMessage: function (force) {
            var self = this;
            if(!self.isPlaying&&!force) return;
            self.sendMessage({
                type: Events.SONG_PROGRESS,
                songInfo: self.getSongInfo()
            });
        },
        refreshPlayState: function () {
            this.isPlaying = $(this.MUSIC_163_PLAYER_ID + ' .ply').getAttribute('data-action') == 'pause';
        },
        changePlayState: function (e) {
            if(this.getAttribute('data-action') == 'pause'){
                Content.isPlaying = false;
                Content.sendMessage({type: Events.SONG_PAUSE})
            }
        },
        checkPlayerInit: function (callback) {
            var self = this;
            var songName = self.getSongName();
            var interval = setInterval(function () {
                if(songName!=''){
                    clearInterval(interval);
                    callback && callback();
                }
            }, self.CHECK_INIT_DELAY)
        },
        bindOtherEvents: function () {
            $$(this.MUSIC_163_PLAYER_ID + ' .ctrl a')[1].addEventListener('click',this.sendPlayTypeChangeMessage)
        },
        connectWithExtension: function () {
            var self = this;
            self.connectPort = chrome.runtime.connect({name: self.UNIQUE_ID});
            self.listenExtensionMessage();
        },
        listenExtensionMessage: function () {
            var self = this;
            self.connectPort.onMessage.addListener(function (message) {
                switch (message.type){
                    case Events.NEXT:
                        self.playNext();
                        break;
                    case Events.PREV:
                        self.playPrev();
                        break;
                    case Events.STATE_CHANGE:
                        self.playOrPause();
                        break;
                    case Events.TIME_CHANGE:
                        self.changeTime(message.percent);
                        break;
                    case Events.PLAY_TYPE_CHANGE:
                        self.changePlayType();
                        break;
                }
            })
        },
        sendPlayTypeChangeMessage: function () {
            setTimeout(function () {
                Content.sendMessage({
                    type: Events.PLAY_TYPE_CHANGE,
                    playType: Content.getPlayType()
                });
            },0);
        },
        sendSongChangeMessage: function () {
            var self = this;
            self.sendMessage({
                type: Events.SONG_CHANGE,
                songInfo: self.getSongInfo()
            });
        },
        sendInitMessage: function () {
            var self = this;
            self.sendMessage({
                "type": Events.INIT_PLAYER,
                "songInfo": self.getSongInfo()
            })
        },
        sendMessage: function (message) {
            this.connectPort.postMessage(message);
        },
        getSongInfo: function () {
            var self = this;
            var singerInfo = self.getSingerInfo();
            return {
                "song_id": self.getSongID(),
                "song_img": self.getSongImage(),
                "song_name": self.getSongName(),
                "singer_id": singerInfo.id,
                "singer_name": singerInfo.name,
                "loaded": self.getSongLoaded(),
                "played": self.getSongPlayed(),
                "time": self.getSongTime(),
                "playing": self.isPlaying,
                "play_type": self.getPlayType()
            }
        },
        getSingerInfo: function () {
            var singerEl = $(this.MUSIC_163_PLAYER_ID + ' .by a');
            return {
                id: singerEl.getAttribute('href').match(/\d+/)[0],
                name: singerEl.innerText
            };
        },
        getPlayType: function () {
            var playTypeEL = $$(this.MUSIC_163_PLAYER_ID + ' .ctrl a')[1];
            return this.playType[playTypeEL.title];
        },
        getSongPlayed: function () {
            return $(this.MUSIC_163_PLAYER_ID + ' .cur').style.width;
        },
        getSongLoaded: function () {
            return $(this.MUSIC_163_PLAYER_ID + ' .rdy').style.width;
        },
        getSongImage: function () {
            return $(this.MUSIC_163_PLAYER_ID + ' .head img').src.replace(/34y34/gi,'130y130');
        },
        getSongTime: function () {
            return $(this.MUSIC_163_PLAYER_ID + ' .time').innerText;
        },
        getSongID: function () {
            return $(this.MUSIC_163_PLAYER_ID + ' .name').getAttribute('href').match(/\d+/)[0];
        },
        getSongName: function(){
            return $(this.MUSIC_163_PLAYER_ID + ' .name').innerText;
        },
        getPageUniqueID: function () {
            this.UNIQUE_ID = Util.generateUUID();
        },
        playPrev: function(){
            $(this.MUSIC_163_PLAYER_ID + ' .prv').click();
        },
        playNext: function(){
            $(this.MUSIC_163_PLAYER_ID + ' .nxt').click();
        },
        playOrPause: function(){
            $(this.MUSIC_163_PLAYER_ID + ' .ply').click();
        },
        changePlayType: function () {
            $$(this.MUSIC_163_PLAYER_ID + ' .ctrl a')[1].click();
        },
        changeTime: function(percent){
            var progressEL = $(this.MUSIC_163_PLAYER_ID + ' .barbg.j-flag');
            var progress = progressEL.clientWidth * percent;
            var rect = progressEL.getBoundingClientRect();
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent("mousedown", true, true, _window, 0, 0, 0, rect.left + progress, rect.top, false, false, false, false, 0, null);
            progressEL.dispatchEvent(evt);
            this.sendSongProgressMessage(true);
        }
    });

    Content.init();
})(window);
