(function (_window) {
    var Popup = Base.extend({

        events: {
            'change .play-next': 'playNext'
        },

        afterInit: function () {
            debugger
            var self = this;
            this.listenContentMessage();

        },
        listenContentMessage: function () {
            chrome.runtime.onConnect.addListener(function(port) {
                console.log(port);
                port.onMessage.addListener(function(msg) {
                    console.log(msg);
                });
            });
        },
        playNext: function(){
            alert('next');
        }
    });

    Popup.init();
})(window);
