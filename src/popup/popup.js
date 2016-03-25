(function (_window) {
    var Popup = Base.extend({



        events: {
            'change .play-next': 'playNext'
        },
        afterInit: function () {
            $('.play-next').classList.add('dfd');

        },
        playNext: function(){
            alert('next');
        }
    });

    Popup.init();
})(window);
