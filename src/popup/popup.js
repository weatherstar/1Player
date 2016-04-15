(function (_window) {
    var Popup = Base.extend({
        events: {
            'click .play-next': 'playNext',
            'click .play-prev': 'playPrev',
            'click .play': 'playOrPause',
            'click .progress': 'changeTime',
            'click .play-type': 'changeContentPlayType',
            'click .play-list': 'toggleSongList',
            'click .clickable': 'goPage',
            'click .one-player-song-list': 'handleSongList'
        },

        MUSIC_163_LINK: 'http://music.163.com/ ',
        SONG_LIST_HEIGHT: '300px',

        songNameEL: $('.song-name'),
        songImageEl: $('.song-pic'),
        singerNameEl: $('.singer-name'),
        playEL: $('.list-control .play'),
        loadedEL: $('.progress-loaded'),
        playedEL: $('.progress-played'),
        playType: $('.play-type'),
        timeEL : $('.play-time'),
        songListEl: $('.one-player-song-list'),
        songListLoadingEl: $('#loading-song-list'),

        playerInit: false,
        currentPageID:'',
        songInfo: null,
        backgroundPage: null,
        playing: false,

        afterInit: function () {
            this.backgroundPage = this.getBackgroundPage();
            this.refreshSongInfo();
            this.initPlayer();
            this.listenExtensionMessage();
        },
        initPlayer: function () {
            this.fillPlayerDOM();
        },
        listenExtensionMessage: function () {
            var self = this;
            chrome.extension.onMessage.addListener(function (msg) {
                self.refreshSongInfo();
                switch(msg){
                    case Events.INIT_PLAYER:
                        self.initPlayer();
                        break;
                    case  Events.SONG_CHANGE:
                        self.changeSong();
                        break;
                    case  Events.SONG_PROGRESS:
                        self.changeProgress();
                        break;
                    case  Events.SONG_PAUSE:
                        self.changePlayState();
                        break;
                    case Events.PLAY_TYPE_CHANGE:
                        self.changePlayType();
                        break;
                    case Events.RESET_PLAYER:
                        self.resetPlayer();
                        break;
                    case Events.RESPONSE_SONG_LIST:
                        self.fillSongList();
                        break;
                }
            })
        },
        changeSong: function () {
            this.fillPlayerDOM();
        },
        changeProgress: function () {
            this.fillProgressDOM();
        },
        changePlayType: function () {
            var icon = this.playType.querySelector('i');
            icon.className = '';
            icon.classList.add('icon-'+this.songInfo.play_type);
        },
        changePlayState: function () {
            if(this.songInfo.playing == this.playing)return;
            var addClass = this.songInfo.playing? 'icon-pause':'icon-play';
            var removeClass = this.songInfo.playing? 'icon-play':'icon-pause';
            this.playEL.classList.remove(removeClass);
            this.playEL.classList.add(addClass);
            this.playing = this.songInfo.playing;
        },
        toggleSongList: function () {
            if(!Popup.checkInit())return;
            var isOpenSongList = Popup.songListEl.clientHeight == 0;
            Popup.songListEl.style.height = isOpenSongList? Popup.SONG_LIST_HEIGHT : 0;
            if(isOpenSongList){
                Popup.backgroundPage.requestSongList();
            }
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
        resetPlayer: function () {
          this.fillPlayerDOM();
        },
        changeTime: function (e) {
            Popup.backgroundPage.changeTime(e.offsetX/this.clientWidth);
        },
        handleSongList: function (e) {
            var target = e.target,
                liArray = null,
                currentLi = e.target.closest('li');
            e.preventDefault();
            if(Popup.isInSongList(target)){
                liArray = Array.prototype.slice.apply(document.getElementsByClassName('f-cb')[0].querySelectorAll('li'));
                liArray.forEach(function (li) {
                   if(li.classList.contains('z-sel')){
                       li.classList.remove('z-sel');
                   }
                });
                currentLi.classList.add('z-sel');
            }
            Popup.backgroundPage.clickSongListItem(currentLi.getAttribute('data-id'));
        },
        isInSongList: function (el) {
          return  document.getElementsByClassName('f-cb')[0] && document.getElementsByClassName('f-cb')[0].contains(el);
        },
        fillProgressDOM: function () {
            this.fillLoaded();
            this.fillPlayed();
            this.fillTime();
            this.changePlayState();
        },
        fillPlayerDOM: function () {
            this.fillSongName();
            this.fillSongImage();
            this.fillSingerName();
            this.fillLoaded();
            this.fillPlayed();
            this.fillTime();
            this.changePlayType();
            this.changePlayState();
        },
        fillSongList: function () {
            this.songListEl.innerHTML = this.backgroundPage.songList;
        },
        fillSongName: function () {
            this.songNameEL.innerHTML = this.songInfo.song_name;
            //todo 使用 this.sonNameEl 调用setAttribute会报 this.sonNameEl undefined错误
            $('.song-name').setAttribute('data-src','/song?id='+ this.songInfo.song_id);
        },
        fillSongImage: function () {
            $('.song-pic').setAttribute('data-src','/song?id='+ this.songInfo.song_id);
            this.songImageEl.querySelector('img').src = this.songInfo.song_img;
        },
        fillSingerName: function () {
            this.singerNameEl.innerHTML = this.songInfo.singer_name;
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
            Popup.backgroundPage.playNext();
        },
        playPrev: function(){
            Popup.backgroundPage.playPrev();
        },
        playOrPause: function(){
            Popup.backgroundPage.playOrPause();
        },
        changeContentPlayType: function(){
            Popup.backgroundPage.changeContentPlayType();
        },
        goPage: function(){
            Popup.backgroundPage.goPage(this.getAttribute('data-src'));
        }
    });
    Popup.init();
})(window);
