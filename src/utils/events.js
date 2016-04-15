(function (_window) {
    _window.Events = {
        INIT_PLAYER:          'INIT',
        SONG_CHANGE:          'SONG_CHANGE',
        TIME_CHANGE:          'TIME_CHANGE',
        SONG_PROGRESS:        'SONG_PROGRESS',
        SONG_PAUSE:           'PAUSE',
        STATE_CHANGE:         'STATE_CHANGE',
        GO_PAGE:              'GO_PAGE',
        PLAY:                 'PLAY',
        NEXT:                 'NEXT',
        PREV:                 'PREV',
        RESET_PLAYER:         'RESET',
        PLAY_TYPE_CHANGE:     'PLAY_TYPE_CHANGE',
        CLICK_SONG_LIST_ITEM: 'CLICK_SONG_LIST_ITEM',
        REQUEST_SONG_LIST:    'REQUEST_SONG_LIST',
        RESPONSE_SONG_LIST:   'RESPONSE_SONG_LIST'
    };
})(window);
