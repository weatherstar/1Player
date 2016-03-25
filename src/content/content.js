(function (_window) {
    var Content = Base.extend({


        MUSIC_163_PLAYER_ID: '#g_player',
        UNIQUE_ID: '',
        GET_MUSIC_ID_DELAY: 1000,
        CHECK_INIT_DELAY: 1000,

        $songNameEl: $('#g_player .name'),

        playerInit: false,
        currentSongID: '',

        events: {
            'click .prv': 'playPrev'
        },
        afterInit: function () {
            var self = this;
            self.getPageUniqueID();
            self.checkPlayerInit(function () {
                self.playerInit = true;
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
                    console.log(self.currentSongID);
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
        getSongInfo: function () {

        },
        getSongID: function () {
            return this.$songNameEl.getAttribute('href').match(/\d+/)[0];
        },
        getSongName: function(){
            return this.$songNameEl.innerText;
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
