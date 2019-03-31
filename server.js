var express = require('express');
var app = express();
require('dotenv').config()

var AccessToken = require('twilio').jwt.AccessToken;
var VideoGrant = AccessToken.VideoGrant;

// Substitute your Twilio AccountSid and ApiKey details
var ACCOUNT_SID = process.env.ACCOUNT_SID;
var API_KEY_SID = process.env.API_KEY_SID;
var API_KEY_SECRET = process.env.API_KEY_SECRET;

app.use(express.static('public'))
  
app.get('/accesstoken/:room/:user', (req, res) => {
    var accessToken = new AccessToken(
        ACCOUNT_SID,
        API_KEY_SID,
        API_KEY_SECRET
    );
    var room = req.params.room;
    var user = req.params.user;
    console.log(room+ ' '+ user);

    accessToken.identity = user;

    var grant = new VideoGrant();
    grant.room = room;
    accessToken.addGrant(grant);

    var jwt = accessToken.toJwt();

    res.json({room, user, jwt});
})

app.listen(3000);
