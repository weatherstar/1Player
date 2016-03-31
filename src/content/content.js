(function (_window) {

    var eventMatchers = {
        'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
        'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
    };
    var defaultOptions = {
        pointerX: 0,
        pointerY: 0,
        button: 0,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        bubbles: true,
        cancelable: true
    };
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
            $('#g_player .barbg.j-flag').addEventListener('click', function (e) {
                console.log(e);
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
                        break;
                    case Events.TIME_CHANGE:
                        self.changeTime(message.percent);
                        break;
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
        },
        changeTime: function(percent){
            var progressEL = $(this.MUSIC_163_PLAYER_ID + ' .barbg.j-flag');
            var offsetX = progressEL.clientWidth * percent;
            this.simulate(progressEL,'mousedown');

        },
        simulate: function(element, eventName)
        {
        var options = this.extend(defaultOptions, arguments[2] || {});
        var oEvent, eventType = null;

        for (var name in eventMatchers)
        {
            if (eventMatchers[name].test(eventName)) { eventType = name; break; }
        }

        if (!eventType)
            throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');

        if (document.createEvent)
        {
            oEvent = document.createEvent(eventType);
            if (eventType == 'HTMLEvents')
            {
                oEvent.initEvent(eventName, options.bubbles, options.cancelable);
            }
            else
            {
                oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
                    options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
                    options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
            }
            element.dispatchEvent(oEvent);
        }
        else
        {
            options.clientX = options.pointerX;
            options.clientY = options.pointerY;
            var evt = document.createEventObject();
            oEvent = extend(evt, options);
            element.fireEvent('on' + eventName, oEvent);
        }
        return element;
    },

    extend: function(destination, source) {
        for (var property in source)
            destination[property] = source[property];
        return destination;
    }

    });

    Content.init();
})(window);
