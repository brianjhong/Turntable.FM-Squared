/**
 * A subset of Turntable.fm Chat Bot:
 * https://github.com/dnephin/Turntable.fm-chat-bot
 */

// turntable object
window.tt = turntable;

// room instance
window.room = null; //getRoom();

// room manager
window.roomman = null; //getRoomManager();

// send a message
window.say = function(msg) {
	var $chatForm = $(room.nodes.chatForm)
	$chatForm.find('input').val(msg)
	$chatForm.submit()
}

// get room reference
/*
window.getRoom = function() {
	for (var k in turntable) {
        var v = turntable[k];
        if (v) {
            if (v.creatorId) {
                return v;
            }
        }
    }
    return false;
}

// get roommanager reference
window.getRoomManager = function() {
	for (var k in room) {
        var v = room[k];
        if (v && v.myuserid) {
            return v;
        }
    }
    return false;
}
*/

// generate a random number within a range.
function randomDelay(min, max) {
    min = min || 2;
    max = max || 70;
	return (Math.random() * max + min) * 1000;
}

function randomChoice(options) {
    var idx = Math.floor(Math.random() * options.length);
    return options[idx];
}

function stringInText(strings, text, forceWord) {
    if (forceWord == null) {
        forceWord = true;
    }

    text = text.toLowerCase()
	for (var string in strings) {
		string = string.toLowerCase();
        if (forceWord) {
            string = new RegExp("\\b#{string}\\b");
        }
		if (text.search(string) > -1) {
			return true
		}
    }
	return false
}

/**
 * Where the magic happens.
 */
(function(){

    // TT.FM objects
    var ttObj = null;
    var roomInfo = null;

    // whether to alert on mute
    var muteAlert = false;

    // aliases
    var nameAliases = [
        'coreyballou',
        'Dr. awkwa .rD',
        'Corey Ballou',
        'CoreyBallou',
        'coreyb'
    ];

    // general name aliases
    var generalNameAliases = [
        'djs',
        'everyone',
        'everbody',
        'you all',
        'ya\'ll',
        'you guys'
    ];

    // idle aliases
    var idleAliases = [
        'afk',
        'checkin',
        'check in',
        'check-in',
        'here',
        'idle',
        'there',
        'respond'
    ];

    // array of idle responses
    var idleResponses = [
        'Check check',
        'Yup',
        'Yeah',
        'Hey',
        'Still here',
        'Checking in',
        'Right here',
        'Yo',
        'Not idle',
        'I\'m here',
        'What?',
        'Huh?',
        'Nope',
        'Not here',
        'Yes..'
    ];

    // max idle time that users will accept
    var maxIdleTime = 6 * 60 * 1000;

    // the maximum idle response frequency
    var maxIdleResponseFreq = 15 * 1000;

    // the last idle response time
    var lastIdleResponse = 0;

    /**
     * Function to retrieve turntable objects.
     */
    function getTurntableObjects() {
        // reset room
        room = null;

        var dfd = $.Deferred();
        var resolveWhenReady = function() {
            if (window.location.pathname !== '/lobby') {
                // find room
                for (var o in tt) {
                    if (tt[o] !== null && tt[0].creatorId) {
                        room = tt[0];
                        break;
                    }
                }

                // find room manager
                if (room) {
                    for (o in room) {
                        if (room[o] !== null && room[o].myuserid) {
                            // we have a room manager
                            roomman = room[o];
                        }
                    }
                    dfd.resolve();
                } else {
                    setTimeout(function() {
                        resolveWhenReady();
                    }, 250);
                }
            } else {
                setTimeout(function() {
                    resolveWhenReady();
                }, 250);
            }
        };

        resolveWhenReady();
        return dfd.promise();
    }

    /**
     * Periodically check if you get mentioned in the chat room.
     */
    function watchForChatMentions(e) {
        // handle alerting when mentioned
        if (stringInText(nameAliases, e.text)) {
            playAlertSound();
        } else {
            if (!stringInText(generalNameAliases, e.text)) {
                return;
            }
        }

        if (!stringInText(idleAliases, e.text) || e.text.length > 35) {
            return;
        }

        // check if we responded to an idle request recently
        var now = new Date().getTime();
        if (now - lastIdleResponse < maxIdleResponseFreq) {
            console.log('Already responded to idle request recently.');
            return;
        }

        // update the last idle response
        lastIdleResponse  = new Date().getTime();

        // log the idle check
        console.log('Possible idle check: ' + e.text);

        // create a response
        var response = randomResponse(idleResponses);

        // handle response
        var responseTimeout = setTimeout(function() {
            console.log('Responding with: ' + response);
            say(response);
        }, randomDelay(2, 8));

        // wait to check for additional mentions
        // setTimeout(watchForChatMentions, 5000);
    }

    /**
     * Play an elert when mentioned.
     */
    function playAlertSound() {
        if (muteAlert) return;
        for (i = 0; i < 5; i++) {
            setTimeout(
                turntablePlayer.playEphemeral(UI_SOUND_CHAT, true),
                i*700
            );
        }
    }

    // ensure we get a valid user object before handling auto-responder
    $.when(getTurntableObjects()).then(function() {
        // watch for chat mentions
        console.log('Found turntable objects, initiating the event listener.');
        tt.addEventListener('message', watchForChatMentions);
    });
})();
