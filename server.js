var express = require('express');
var app = express();
require('dotenv').config()

var AccessToken = require('twilio').jwt.AccessToken;
var VideoGrant = AccessToken.VideoGrant;
var ChatGrant = AccessToken.ChatGrant;

// Substitute your Twilio AccountSid and ApiKey details
var ACCOUNT_SID = process.env.ACCOUNT_SID;
var API_KEY_SID = process.env.API_KEY_SID;
var API_KEY_SECRET = process.env.API_KEY_SECRET;
var CHAT_SERVICE_SID = process.env.CHAT_SERVICE_SID;

app.use(express.static('public'))
  
app.get('/accesstoken/:room/:user', (req, res) => {
    var room = req.params.room;
    var user = req.params.user;
    console.log('Room, User = '+room+ ', '+ user);

    var accessToken = new AccessToken(
        ACCOUNT_SID,
        API_KEY_SID,
        API_KEY_SECRET
    );
    accessToken.identity = user;

    var videoGrant = new VideoGrant();
    videoGrant.room = room;
    accessToken.addGrant(videoGrant);

    var chatGrant = new ChatGrant({
        serviceSid: CHAT_SERVICE_SID,
        endpointId: 'TwilioChat'+ ':' + user + ':' + room
    });
    accessToken.addGrant(chatGrant);

    var jwt = accessToken.toJwt();
    res.json({room, user, jwt});
})

app.listen(process.env.PORT || 3000);
