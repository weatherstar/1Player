(function (_window) {
    var Popup = Base.extend({
        events: {
            'click .play-next': 'playNext',
            'click .play-prev': 'playPrev',
            'click .play-replay': 'replay',
            'click .play': 'playOrPause',
            'click .progress': 'changeTime',
            'click .volume-bar': 'changeVolume',
            'click .play-type': 'changeContentPlayType',
            'click .play-list': 'toggleSongList',
            'click .clickable': 'goPage',
            'click .one-player-song-list': 'handleSongList',
            'click .play-like': 'addToLike'
        },

        MUSIC_163_LINK: 'https://music.163.com/ ',
        SONG_LIST_HEIGHT: '300px',

        songNameEL: $('.song-name'),
        songImageEl: $('.song-pic'),
        singerNameEl: $('.singer-name'),
        playEL: $('.one-player-play-bar .play'),
        loadedEL: $('.progress-loaded'),
        bitRateEl: $('#bit-rate'),
        playedEL: $('.progress-played'),
        likeEl: $('.play-like'),
        playType: $('.play-type'),
        timeEL: $('.play-time'),
        volumeEl: $('.current-volume'),
        songListEl: $('.one-player-song-list'),
        songLrcEl: $('.one-player-lrc'),
        songLrcWrapEl: $('.one-player-lrc-wrap'),
        songListLoadingEl: $('#loading-song-list'),
        addLikeLoadingEl: $('.add-like-loading'),
        lrcCheckEl: $('#lrc-check'),

        playerInit: false,
        currentPageID:'',
        songInfo: null,
        backgroundPage: null,
        activeLrcEl: null,
        playing: false,
        currentLrc: null,

        afterInit: function () {
            this.backgroundPage = this.getBackgroundPage();
            this.refreshSongInfo();
            this.initPlayer();
            this.fillBitRate();
            this.getSongLrc();
            this.listenExtensionMessage();
            this.initLrcCheck();
        },
        initPlayer: function () {
            this.fillPlayerDOM();
        },
        initLrcCheck: function () {
            var self = this;
            var lrcSwitch = new Switch(this.lrcCheckEl,{
                checked: self.backgroundPage.isShowDesktopLrc(),
                onSwitchColor: '#F15648',
                size: 'small',
                showText: true,
                onText: '词',
                offText: '词',
                onChange: function (checked) {
                    self.backgroundPage.setOptions({
                        desktopLrc : checked ? 'show' : 'hide'
                    })
                }
            });
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
                        self.changeLrcPosition();
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
                    case Events.BIT_RATE_CHANGE:
                        self.fillBitRate();
                        break;
                    case Events.RESPONSE_SONG_LRC:
                        self.fillSongLrc();
                        self.changeLrcPosition();
                        break;
                    case Events.ADD_LIKE_START:
                        self.showAddLikeLoading();
                        break;
                    case Events.ADD_LIKE_FINISH:
                        self.hideAddLikeLoading();
                        //self.showSongLike();
                        break;
                    case Events.RESPONSE_SONG_TIME:
                        self.fillTime();
                        break;
                }
            })
        },
        changeSong: function () {
            this.fillPlayerDOM();
            this.selectSongInSongList();
        },
        selectSongInSongList: function () {
            var songEl = null;
            if(this.isSongListOpen()){
                songEl = this.songListEl.querySelector('li[data-id="' + this.songInfo.song_id +'"]');
                if(songEl&&!songEl.classList.contains('z-sel')){
                    songEl.click();
                }
            }
        },
        getSongLrc: function () {
            this.backgroundPage.getSongLrc();
        },
        changeLrcPosition: function () {
            var seconds = Util.getProgressInSeconds(this.backgroundPage.songTime.split('/')[0].split(':'));
            var lrcItem = null;
            if(this.songLrcWrapEl.querySelector('.z-sel')){
                lrcItem = this.songLrcWrapEl.querySelector('.z-sel');
                lrcItem.classList.remove('z-sel');
            }else{
                lrcItem = this.songLrcWrapEl.querySelector('[data-time^="' + seconds +'."]');
            }
            if(lrcItem){
                if(this.currentLrc){
                    this.currentLrc.classList.remove('active');
                }
                this.songLrcWrapEl.style.transform = 'translate(0,-' + lrcItem.offsetTop + 'px)';
                lrcItem.classList.add('active');
                if(!lrcItem == this.currentLrc){
                    this.backgroundPage.showLrcNotification(lrcItem.innerHTML);
                }
                this.currentLrc = lrcItem;
            }
        },
        changeProgress: function () {
            this.fillProgressDOM();
        },
        changeVolume: function (e) {
            e.currentTarget.querySelector('.current-volume').style.width = e.offsetX + 'px';
            this.backgroundPage.changeVolume(e.offsetX/e.currentTarget.clientWidth);
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
            if(!this.checkInit())return;
            var isSongListOpen = this.isSongListOpen();
            this.songListEl.style.height = isSongListOpen? 0 : this.SONG_LIST_HEIGHT;
            if(!isSongListOpen){
                this.backgroundPage.requestSongList();
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
            this.songTime = this.getBackgroundPage().songTime;
        },
        hideAddLikeLoading: function () {
            this.addLikeLoadingEl.style.display = 'none';
        },
        showAddLikeLoading: function () {
            this.addLikeLoadingEl.style.display = 'block';
        },
        resetPlayer: function () {
          this.fillPlayerDOM();
        },
        replay: function () {
            this.backgroundPage.changeTime(0);
        },
        changeTime: function (e) {
            this.backgroundPage.changeTime(e.offsetX/e.currentTarget.clientWidth);
        },
        addToLike: function () {
            this.backgroundPage.addToLike();
        },
        handleSongList: function (e) {
            var target = e.target,
                liArray = null,
                currentLi = e.target.closest('li');
            e.preventDefault();
            if(this.isInSongList(target)){
                liArray = Array.prototype.slice.apply(document.getElementsByClassName('f-cb')[0].querySelectorAll('li'));
                liArray.forEach(function (li) {
                   if(li.classList.contains('z-sel')){
                       li.classList.remove('z-sel');
                   }
                });
                currentLi.classList.add('z-sel');
                this.scrollToCurrentSong();
                this.backgroundPage.clickSongListItem(currentLi.getAttribute('data-id'));
            }else if(target.classList.contains('f-tdu')){
                this.backgroundPage.goPage(target.getAttribute('href'));
            }
        },
        isSongListOpen: function () {
            return this.songListEl.clientHeight != 0;
        },
        isInSongList: function (el) {
          return  document.getElementsByClassName('f-cb')[0] && document.getElementsByClassName('f-cb')[0].contains(el);
        },
        scrollToCurrentSong: function () {
            var currentSongEl = this.songListEl.querySelector('.z-sel');
            if(currentSongEl&&(currentSongEl.offsetTop < this.songListEl.scrollTop || currentSongEl.offsetTop >= this.songListEl.scrollTop + this.songListEl.clientHeight - currentSongEl.clientHeight)){
                this.songListEl.scrollTop = currentSongEl.offsetTop;
            }
        },
        fillBitRate: function () {
            this.bitRateEl.innerHTML = this.backgroundPage.options.bitRate + 'K';
        },
        fillProgressDOM: function () {
            this.fillLoaded();
            this.fillPlayed();
            this.fillVolume();
            this.changePlayState();
        },
        fillPlayerDOM: function () {
            this.fillSongName();
            this.fillSongImage();
            this.fillSingerName();
            this.fillLoaded();
            this.fillPlayed();
            this.fillVolume();
            this.changePlayType();
            this.changePlayState();
        },
        fillSongList: function () {
            this.songListEl.innerHTML = this.backgroundPage.songList;
            this.scrollToCurrentSong();
        },
        fillSongLrc: function () {
            this.songLrcWrapEl.innerHTML = this.backgroundPage.songLrc.innerHTML;
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
            if(this.songInfo.singer_id > 0){
                $('.singer-name').setAttribute('data-src','/artist?id='+ this.songInfo.singer_id);
            }
        },
        fillPlayed: function () {
            this.playedEL.style.width = this.songInfo.played;
        },
        fillLoaded: function () {
            this.loadedEL.style.width = this.songInfo.loaded;
        },
        fillTime: function(){
            this.timeEL.innerText = this.backgroundPage.songTime;
        },
        fillVolume: function () {
            $('.current-volume').style.width = this.songInfo.volume;
        },
        showSongLike: function () {
            this.likeEl.classList.add('like');
        },
        playNext: function(){
            this.backgroundPage.playNext();
        },
        playPrev: function(){
            this.backgroundPage.playPrev();
        },
        playOrPause: function(){
            this.backgroundPage.playOrPause();
        },
        changeContentPlayType: function(){
            this.backgroundPage.changeContentPlayType();
        },
        goPage: function(e){
            this.backgroundPage.goPage(e.currentTarget.getAttribute('data-src'));
        }
    });
    Popup.init();
})(window);
