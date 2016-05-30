
var defaultOptions = {
    notificationTimeout: 3000,
    bitRate: 96,
    desktopLrc: "show"
};

function getStorage(){
    chrome.storage.sync.get(defaultOptions, function(items) {
        for(var key in items){
            setDefault(key,items[key]);
        }
    });
}
function setStorage(options){
    chrome.storage.sync.set(options, function() {
        var successTip = document.querySelector('.success-tip');
        successTip.innerText = '保存成功';
        successTip.style.display = 'block';
        setTimeout(function () {
            successTip.style.display = 'none';
        },2000);
    });
}

function setDefault(key, value){
    document.querySelector('#' + key).value = value;
}

function saveOptions(){
    var options = {};
    for(var key in defaultOptions){
        options[key] =  document.querySelector('#' + key).value;

    }
    setStorage(options);
    chrome.extension.getBackgroundPage().Background.getOptions();
}



document.addEventListener('DOMContentLoaded', getStorage);
document.getElementById('save-options').addEventListener('click', saveOptions);