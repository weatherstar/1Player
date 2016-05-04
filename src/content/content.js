(function (_window) {
    var Content = Base.extend({

        MUSIC_163_PLAYER_ID: Config.music_163_player_id,
        MUSIC_163_LIST_ID: Config.music_163_player_list_id,
        UNIQUE_ID: '',
        CHECK_MUSIC_CHANGE_DELAY: 500,
        CHECK_INIT_DELAY: 1000,


        playerInit: false,
        bitRate: 0,
        isPlaying: '',
        clickEL: null,
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

        listIconEL: $('.icn.icn-list'),
        volumeIconEl: $('.icn.icn-vol'),
        volumeBarEl: $('.vbg.j-t'),
        volumeEL: $('.m-vol'),
        progressEL: $('.barbg.j-flag'),

        afterInit: function () {
            var self = this;
            self.addBitRateDataElement();
            self.injectSongImprove();
            self.getPageUniqueID();
            self.checkPlayerInit(function () {
                self.playerInit = true;
                self.connectWithExtension();
                self.sendInitMessage();
                self.listenMusicChange();
            });
            self.addGoPageElement();
            self.bindOtherEvents();

        },
        addBitRateDataElement: function () {
            var el = document.createElement('a');
            el.id = 'bit-rate';
            el.href = 'javascript:;';
            document.body.appendChild(el);
        },
        injectSongImprove: function(){
            Util.injectScript(chrome.extension.getURL('js/improve.js'),'body');
        },
        listenMusicChange: function () {
            var self = this;
            var songID = '';
            setInterval(function () {
                self.refreshPlayState();
                self.sendSongProgressMessage();
                self.checkBitRateChange();
                songID = self.getSongID();
                if(songID != self.currentSongID){
                    self.currentSongID = songID;
                    self.sendSongChangeMessage();
                }
            }, self.CHECK_MUSIC_CHANGE_DELAY);
        },
        checkBitRateChange: function () {
            var self = this;
            var bitRateEl = document.querySelector('#bit-rate');
            chrome.storage.sync.get({
                bitRate: 96
            }, function(items) {
                if(items.bitRate != self.bitRate){
                    self.bitRate = items.bitRate;
                    bitRateEl.setAttribute('data-bit',self.bitRate);
                    bitRateEl.click();
                }
            });
        },
        sendSongProgressMessage: function (force) {
            var self = this;
            if(!self.isPlaying&&!force) return;
            self.sendMessage({
                type: Events.SONG_PROGRESS,
                songInfo: self.getSongInfo()
            });
        },
        addGoPageElement: function () {
            this.clickEL = document.createElement('a');
            this.clickEL.id = 'on-player-go-page';
            document.body.appendChild(this.clickEL);
        },
        refreshPlayState: function () {
            var state = $(this.MUSIC_163_PLAYER_ID + ' .ply').getAttribute('data-action') == 'pause';
            if (this.isPlaying != state && state == false){
                this.sendMessage({type: Events.SONG_PAUSE});
            }
            this.isPlaying = state;
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
                }else{
                    songName = self.getSongName();
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
                    case Events.VOLUME_CHANGE:
                        self.changeVolume(message.percent);
                        break;
                    case Events.TIME_CHANGE:
                        self.changeTime(message.percent);
                        break;
                    case Events.PLAY_TYPE_CHANGE:
                        self.changePlayType();
                        break;
                    case Events.GO_PAGE:
                        self.goPage(message.page);
                        break;
                    case Events.CLICK_SONG_LIST_ITEM:
                        self.selectSongInSongList(message.id);
                        break;
                    case Events.REQUEST_SONG_LIST:
                        self.sendSongList();
                        break;
                    case Events.REQUEST_SONG_LRC:
                        self.sendSongLrc();
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
        sendSongList: function () {
            var self = this;
            this.getSongList(function (songList) {
                self.sendMessage({
                    type: Events.RESPONSE_SONG_LIST,
                    songList: songList.innerHTML
                })
            });
        },
        sendSongLrc: function () {
            var self = this;
            this.getSongLrc(function (lrc) {
                Util.observeDOM(document.querySelector('.listlyric.j-flag'), function () {
                    self.sendMessage({
                        type: Events.RESPONSE_SONG_LRC,
                        songLrc: lrc.innerHTML
                    })
                });
                self.sendMessage({
                    type: Events.RESPONSE_SONG_LRC,
                    songLrc: lrc.innerHTML
                })
            });
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
        getSongList: function (callback) {
            callback = callback || Util.noop;
            this.showSongList(function (songList) {
                callback(songList.querySelector('.listbdc.j-flag'));
            });
        },
        getSongLrc: function (callback) {
            callback = callback || Util.noop;
            this.showSongList(function (songList) {
                callback(songList.querySelector('.listlyric.j-flag'));
            });
        },
        showSongList: function (callback) {
            var songListEl = $(this.MUSIC_163_LIST_ID);
            var interval = null;
            var self = this;
            callback = callback || Util.noop;
            if(!songListEl){
                self.listIconEL.click();
                interval = setInterval(function () {
                    songListEl = $(self.MUSIC_163_LIST_ID);
                    if(songListEl){
                        callback(songListEl);
                        clearInterval(interval);
                    }
                },10);
            }else{
                callback(songListEl);
            }
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
                "play_type": self.getPlayType(),
                "volume": self.getVolumePercent()
            }
        },
        getSingerInfo: function () {
            var singerEl = $(this.MUSIC_163_PLAYER_ID + ' .by a');
            return {
                id: singerEl.getAttribute('href').match(/\d+/)[0],
                name: singerEl.innerHTML
            };
        },
        getVolumePercent: function () {
            return this.volumeBarEl.querySelector('.curr').clientHeight / this.volumeBarEl.clientHeight * 100 + '%';
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
            return $(this.MUSIC_163_PLAYER_ID + ' .head img').src.replace(/34y34/gi,'180y180');
        },
        getSongTime: function () {
            return $(this.MUSIC_163_PLAYER_ID + ' .time').innerHTML.replace(/<\/*em>/gi,'');
        },
        getSongID: function () {
            return $(this.MUSIC_163_PLAYER_ID + ' .name').getAttribute('href').match(/\d+/)[0];
        },
        getSongName: function(){
            return $(this.MUSIC_163_PLAYER_ID + ' .name').innerHTML;
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
        goPage: function (page) {
            this.clickEL.href = page;
            this.clickEL.click();
        },
        changeVolume: function (percent) {
            var self = this;
            this.showVolume();
            var volumeBarHeight = this.volumeBarEl.clientHeight;
            var volume = this.volumeBarEl.clientHeight * percent;
            var rect = this.volumeBarEl.getBoundingClientRect();
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent("mousedown", true, true, _window, 0, 0, 0, rect.left, rect.top + volumeBarHeight - volume, false, false, false, false, 0, null);
            this.volumeBarEl.dispatchEvent(evt);
            evt = document.createEvent("MouseEvents");
            evt.initMouseEvent("mouseup", true, true, _window, 0, 0, 0, rect.left, rect.top + volumeBarHeight - volume, false, false, false, false, 0, null);
            this.volumeBarEl.dispatchEvent(evt);

        },
        changeTime: function(percent){
            var progress = this.progressEL.clientWidth * percent;
            var rect = this.progressEL.getBoundingClientRect();
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent("mousedown", true, true, _window, 0, 0, 0, rect.left + progress, rect.top, false, false, false, false, 0, null);
            this.progressEL.dispatchEvent(evt);
            this.sendSongProgressMessage(true);
        },
        showVolume: function () {
            if(!this.checkVolumeShow()){
                this.volumeIconEl.click();
            }
        },
        checkVolumeShow: function () {
            return this.volumeEL.style.visibility == 'visible';
        },
        selectSongInSongList: function(id){
            var self = this;
            self.getSongList(function (songList) {
                songList.querySelector('li[data-id="'+ id +'"]').click();
            });
        }
    });

    Content.init();
})(window);
