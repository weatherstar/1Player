    var Background = Base.extend({
        MUSIC_163_LINK: 'http://music.163.com/ ',

        playerInit: false,
        currentPageID:'',

        afterInit: function () {
            this.listenContentMessage();
        },
        listenContentMessage: function () {
            var self = this;
            chrome.runtime.onConnect.addListener(function(port) {
                port.onMessage.addListener(function(msg) {
                    switch (msg.type){
                        case Events.INIT:
                            if(self.playerInit) return;
                            self.playerInit = true;
                            self.currentPageID = port.name;
                            self.songInfo = msg.songInfo;
                            self.initPlayer();
                            break;
                        case Event.PLAY:
                            break;
                    }
                });
            });
        }
    });

    Background.init();