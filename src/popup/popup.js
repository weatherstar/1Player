(function (_window) {
    var Popup = Base.extend({
        events: {
            'change .play-next': 'playNext'
        },

        MUSIC_163_LINK: 'http://music.163.com/ ',

        songNameEL: $('.song-name'),
        songImageEl: $('.song-pic'),
        singerNameEl: $('.singer-name'),
        playEL: $('.list-control .play'),
        loadedEL: $('.progress-loaded'),
        playedEL: $('.progress-played'),
        timeEL : $('.play-time'),

        playerInit: false,
        currentPageID:'',
        songInfo: null,

        afterInit: function () {
            if(this.checkInit()){
                this.initPlayer();
            }
            this.listenExtensionMessage();
        },
        initPlayer: function () {
            this.refreshSongInfo();
            this.fillPlayerDOM();
        },
        listenExtensionMessage: function () {
            var self = this;
            chrome.extension.onMessage.addListener(function (msg) {
                switch(msg){
                    case Events.INIT_PLAYER:
                        self.initPlayer();
                        break;
                    case  Events.SONG_CHANGE:
                        self.changeSong();
                        break;
                }
            })
        },
        changeSong: function () {
            this.refreshSongInfo();
            this.fillPlayerDOM();
        },
        checkInit: function () {
            return this.getBackgroundPage().playerInit;
        },
        getSongInfo: function () {
            return this.getBackgroundPage().songInfo;
        },
        getBackgroundPage: function () {
            return chrome.extension.getBackgroundPage().Background;
        },
        refreshSongInfo: function () {
            this.songInfo = this.getSongInfo();
        },
        fillPlayerDOM: function () {
            this.fillSongName();
            this.fillSongImage();
            this.fillSingerName();
            this.fillLoaded();
            this.fillPlayed();
            this.fillTime();
        },
        fillSongName: function () {
            this.songNameEL.innerText = this.songInfo.song_name;
            //todo 使用 this.sonNameEl 调用setAttribute会报 this.sonNameEl undefined错误
            $('.song-name').setAttribute('data-src','/song?id='+ this.songInfo.song_id);
        },
        fillSongImage: function () {
            $('.song-pic').setAttribute('data-src','/song?id='+ this.songInfo.song_id);
            this.songImageEl.querySelector('img').src = this.songInfo.song_img;
        },
        fillSingerName: function () {
            this.singerNameEl.innerText = this.songInfo.singer_name;
            $('.singer-name').setAttribute('data-src','/artist?id='+ this.songInfo.singer_id);
        },
        fillPlayed: function () {
            this.playedEL.style.width = this.songInfo.played;
        },
        fillLoaded: function () {
            this.loadedEL.style.width = this.songInfo.loaded;
        },
        fillTime: function(){
            this.timeEL.innerText = this.songInfo.time;
        },
        playNext: function(){
            alert('next');
        }
    });
    Popup.init();
})(window);
