    var Background = Base.extend({

        playerInit: false,
        currentPageID:'',
        songInfo: null,

        afterInit: function () {
            this.listenContentMessage();
        },
        listenContentMessage: function () {
            var self = this;
            chrome.runtime.onConnect.addListener(function(port) {
                port.onMessage.addListener(function(msg) {
                    switch (msg.type) {
                        case Events.INIT:
                            if (self.playerInit) return;
                            self.playerInit = true;
                            self.currentPageID = port.name;
                            self.songInfo = msg.songInfo;
                            chrome.extensions.runtime.sendMessage('refresh');
                            break;
                        case Event.PLAY:
                            break;
                    }

                });
            });
        }
    });

    Background.init();