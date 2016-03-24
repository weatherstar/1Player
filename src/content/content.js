(function (_window) {
    var Content = Base.extend(Base,{
        events: {
            'click .prv': 'sendMessage,'
        },
        afterInit: function(){
            alert('test');
        }
    });

    Content.init();
})(window);
