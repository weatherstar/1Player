(function (_window) {
    var Content = Base.extend({

        MUSIC_163_PLAYER_ID: '#g_player',
        UNIQUE_ID: '',
        GET_MUSIC_ID_DELAY: 1000,
        CHECK_INIT_DELAY: 1000,


        playerInit: false,
        currentSongID: '',
        connectPort: '',

        events: {
            'click .prv': 'playPrev'
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
                songID = self.getSongID();
                if(songID != self.currentSongID){
                    self.currentSongID = songID;
                }
            }, self.GET_MUSIC_ID_DELAY);
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
                
            })
        },
        sendInitMessage: function () {
            var self = this;
            self.sendMessage({
                "type": Events.INIT,
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
                "time": self.getSongTime()
            }
        },
        getSingerInfo: function () {
            var singerEl = $(this.MUSIC_163_PLAYER_ID + ' .by a');
            return {
                id: singerEl.getAttribute('href').match(/\d+/)[0],
                name: singerEl.innerText
            };
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

        },
        playNext: function(){

        },
        play: function(){

        },
        pause: function(){

        }
    });

    Content.init();
})(window);
