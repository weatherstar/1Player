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
            var self = this;
            var elements = null;
            var event = null;
            if(self.events){
                for(var item in self.events){
                    if(self.events.hasOwnProperty(item)){
                        event = item.split(' ');
                        elements = Array.prototype.slice.apply(document.querySelectorAll(event[1]));
                        elements.forEach(function (element) {
                            element.addEventListener(event[0],self[self.events[item]])
                        })
                    }
                }
            }
        }
    };
    _window.Base = new Base();
})(window);