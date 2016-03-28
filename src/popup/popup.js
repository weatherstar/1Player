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

        afterInit: function () {
            var self = this;
        },
        initPlayer: function () {
            var self = this;
            self.fillPlayerDOM();
        },
        fillPlayerDOM: function () {
            this.fillSongName();
            this.fillSongImage();
            this.fillSingerName();
            this.fillLoaded();
            this.fillTime();
        },
        fillSongName: function () {
            this.songNameEL.innerText = this.songInfo.song_name;
            this.songNameEl.setAttribute('data-src','/song?id='+ this.songInfo.song_id);
        },
        fillSongImage: function () {
            this.songImageEl.setAttribute('data-src','/song?id='+ this.songInfo.song_id);
            this.songImageEl.querySelector('img').src = this.songInfo.song_img;
        },
        fillSingerName: function () {
            this.singerNameEl.innerText = this.songInfo.singer_name;
            this.singerNameEl.setAttribute('data-src','/artist?id='+ this.songInfo.singer_id);
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
