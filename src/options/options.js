function getStorage(){
    chrome.storage.sync.get({
        notificationTimeout: 3000
    }, function(items) {
        setDefaultNotificationTimeout(items.notificationTimeout);
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

function makeArray(a){
    return Array.prototype.slice.apply(a);
}

function saveOptions(){
    makeArray(document.querySelectorAll('input[name=notification]')).forEach(function (radio) {
        if(radio.checked){
            setStorage({
                notificationTimeout: radio.value
            });
        }
    });
    chrome.extension.getBackgroundPage().Background.getOptions();
}



document.addEventListener('DOMContentLoaded', getStorage);
document.getElementById('save-options').addEventListener('click', saveOptions);