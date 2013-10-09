var CandyShop = (function(self) {return self;}(CandyShop || {}));

CandyShop.Avatar = (function(self, Candy, $) {

	var _options = {
            avatar: '' // holds current avatar
        }
        var _userAvatar = {}; // avatar cache for users on the chat
        var _updateAvatarQueue = []; // list of nicks to update avatar
        var _updateTimeoutId = null; // id of pending update call
        
        /* Process list of nicks that need their avatar updated */
        var _processUpdateQueue = function () {
            _updateTimeoutId = null
            var queueLength = _updateAvatarQueue.length;
            for (var i = 0; i < queueLength; i++) {
                var nick = _updateAvatarQueue[i];
                $('div.user[data-nick="'+ nick +'"]').addClass(_userAvatar[nick]);
            } //for
            _updateAvatarQueue.splice(0, queueLength);
        } //processUpdateQueue()
        
        /* Updates avatars in the roster */
        var checkPresence = function (iq) {
            var avatar = $('status avatar', iq).eq(0).attr('class');
            if (avatar) {
                var nick = $(iq).eq(0).attr('from').split('/')[1];

                _userAvatar[nick] = avatar;
                $('div.user[data-nick="'+ nick +'"]').addClass(avatar);
            } //if
            return true;
        };
        
	self.init = function(options) {
                $.extend(_options, options);
		self.applyTranslations();
                
                /* Replace some templates to include avatars */
                Candy.View.Template.Message.item = '<dt>{{time}}</dt><dd class="{{displayName}} {{extraClass}}"><span class="label"><a href="http://www.doyoulookgood.com/profile/view/{{displayName}}" class="avatar" target="_blank"><span></span></a><a href="#" class="name">{{displayName}}</a></span>{{{message}}}</dd>';
                Candy.View.Template.Roster.user = '<div class="user role-{{role}} affiliation-{{affiliation}}{{#me}} me{{/me}}" id="user-{{roomId}}-{{userId}}" data-jid="{{userJid}}" data-nick="{{nick}}" data-role="{{role}}" data-affiliation="{{affiliation}}"><a href="http://www.doyoulookgood.com/profile/view/{{displayName}}" class="avatar" target="_blank"><span></span></a><div class="label">{{displayNick}}</div><ul><li class="context" id="context-{{roomId}}-{{userId}}"></li><li class="role role-{{role}} affiliation-{{affiliation}}" data-tooltip="{{tooltipRole}}"></li><li class="ignore" data-tooltip="{{tooltipIgnored}}"></li></ul></div>';
                
                /* prepend some text to messages with avatar */
                $(Candy.Core.Message).bind('beforesend', function(e, data) {
                    var message = data.message;
                    if(options.avatar !== '' && $.trim(message) !== '') {
                            message = '|a:'+ options.avatar +'|' + message;
                    } //if
                    data.message = message;
		});

                /* add some parameters to pass to template in case we have an avatar set */
                $(Candy.Core.Message).bind('beforerender', function (e, data) {
                    var message = data.templateData.message;
                    var matches = message.match(/^\|a:([^|]*)\|/gm);
                    
                    var avatar = '';
                    if (matches !== null) {
                        
                        /* extract avatar name from first match */
                        avatar = matches[0].substring(3, matches[0].length-1);

                        /* remove the extra stuff added by pluggin */
                        message = message.replace(/^\|a:([^|]*)\|/gm, '');
                        
                        /* replace colors in case color plugin missed it */
                        if (CandyShop.hasOwnProperty('Colors')) {
                            message = message.replace(/^\|c:([0-9]{1,2})\|(.*)/gm, '<span class="colored color-$1">$2</span>');
                        } //if
                        data.templateData.message = message;
                    } //if
                    
                    data.templateData.extraClass = avatar;
                });
                
                /* Update presence with avatar when joining a room */
                $(Candy.Core.ChatRoom).bind('add', function(e,data) {
                    if (data.type == 'groupchat') {
                        Candy.Core.getConnection().send($pres({to: data.roomJid}).c('status').c('avatar',{'class': options.avatar}).tree());
                    } else {
                        
                    } //if
                });
                
                /* check for private chats and update icons when user switches to it */
                $(Candy.Core.ChatRoom).bind('show', function (e, data) {
                    var roomJidParts = data.roomJid.split('/');
                    
                    /* private rooms append /nick to the roomJid */
                    if (roomJidParts.length > 1) {
                        var nick = roomJidParts[1];
                        
                        /* queue the nicks to be updated */
                        _updateAvatarQueue.push(Candy.Core.getUser().getNick());
                        _updateAvatarQueue.push(nick);
                        
                        if (!_updateTimeoutId) {
                            _updateTimeoutId = setTimeout(_processUpdateQueue, 100);
                        } //if
                    } //if
                });
                
                /* register presence checker after connected */
                $(Candy.Core).bind('connect', function() {
                    Candy.Core.getConnection().addHandler(checkPresence,null,'presence');
                });
		
	};

        self.setAvatar = function(avatar) {
            var rooms = Candy.Core.getRooms();
            for(var roomId in rooms) {
                var room = rooms[roomId]
                Candy.Core.getConnection().send($pres({to: room.getJid()}).c('status').c('avatar',{'class': avatar}).tree());
            } //rooms
            options.avatar = avatar;
        };
        
	self.applyTranslations = function() {
		
	};

	return self;
}(CandyShop.Avatar || {}, Candy, jQuery));