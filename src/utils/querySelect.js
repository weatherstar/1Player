(function (_window) {
    _window.$ = function(s){
        return document.querySelector(s);
    };

    _window.$$ = function (s) {
        return Array.prototype.slice.apply(document.querySelectorAll(s))
    };
})(window);
