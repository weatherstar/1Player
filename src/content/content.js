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
        sendSongProgressMessage: function () {
            var self = this;
            if(!self.isPlaying) return;
            console.log('progress');
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
                        self.playNext();
                        break;
                    case Events.STATE_CHANGE:
                        self.playOrPause();
                }
            })
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
                "playing": self.isPlaying
            }
        },
        getSingerInfo: function () {
            var singerEl = $(this.MUSIC_163_PLAYER_ID + ' .by a');
            return {
                id: singerEl.getAttribute('href').match(/\d+/)[0],
                name: singerEl.innerText
            };
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
        }
    });

    Content.init();
})(window);
