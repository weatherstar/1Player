function getStorage(){
    chrome.storage.sync.get({
        notificationTimeout: 3000,
        bitRate: 96
    }, function(items) {
        setDefaultNotificationTimeout(items.notificationTimeout);
        setDefaultBitRate(items.bitRate);
    });
}
function setStorage(options){
    chrome.storage.sync.set(options, function() {
        var successTip = document.querySelector('.success-tip');
        successTip.style.display = 'block';
        setTimeout(function () {
            successTip.style.display = 'none';
        },2000);
    });
}
function setDefaultNotificationTimeout(timeout){
    makeArray(document.querySelectorAll('input[name=notification]')).forEach(function (radio) {
        if(radio.value == timeout){
            radio.checked = true;
        }
    });
}
function setDefaultBitRate(bitRate){
    makeArray(document.querySelectorAll('input[name=bit-rate]')).forEach(function (radio) {
        if(radio.value == bitRate){
            radio.checked = true;
        }
    });
}

function makeArray(a){
    return Array.prototype.slice.apply(a);
}

function saveOptions(){
    var notificationTimeout;
    var bitRate;
    makeArray(document.querySelectorAll('input[name=notification]')).forEach(function (radio) {
        if(radio.checked){
            notificationTimeout = radio.value;
        }
    });
    makeArray(document.querySelectorAll('input[name=notification]')).forEach(function (radio) {
        if(radio.checked){
            bitRate = radio.value;
        }
    });
    setStorage({
        notificationTimeout: notificationTimeout,
        bitRate: bitRate
    });
    chrome.extension.getBackgroundPage().Background.getOptions();
}



document.addEventListener('DOMContentLoaded', getStorage);
document.getElementById('save-options').addEventListener('click', saveOptions);