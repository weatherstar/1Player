(function (_window) {
    function Base(){};
    Base.prototype = {
        init: function(){
            this.bindEvent();
            this.afterInit && this.afterInit(this,arguments);
        },
        extend: function (child) {
            var O = function () {},
                o = null;
            O.prototype = Object.create(Base.prototype);
            o = new O();
            for(var item in child){
                if(child.hasOwnProperty(item)){
                    o[item] = child[item];
                }
            }
            return o;
        },
        bindEvent: function(){
            if(this.events){
                for(var event in this.events){
                    console.log(event);
                }
            }
        }
    };
    _window.Base = Base;
})(window);