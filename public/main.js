var trackArray;
var dataTrack;
var chatChannel;
var _chatClient;
var vidParticipant = document.querySelector('.vidParticipant');
var vidLocal = document.querySelector('.vidLocal');
var disconnectBtn = document.querySelector(".disconnect-btn");
var connectBtn = document.querySelector(".connect-btn");
var sendBtn = document.querySelector(".send-btn");
var sendMessage = document.querySelector(".send-message");
var chat = document.querySelector(".chat");
var clearBoard = document.querySelector(".clear-whiteboard");

//call getUserToken to get token on button click
connectBtn.addEventListener("click", (event) => {
    disconnectBtn.click()
    getUserToken();
})
sendMessage.addEventListener('keypress',e => {
    if(e.keyCode == 13)
        sendBtn.click();
});
//GET token and call connectVideo

function getUserToken(){
    var name = document.querySelector(".name").value;
    var _room = document.querySelector(".roomname").value;
    if(_room == '') _room = 'test';
    fetch(window.location.origin+"/accesstoken/"+_room+"/"+name)
        .then(function(response) {
            if (response.status !== 200) {
                console.log('Problem Status Code: ' +response.status);
                return;
            }
            response.json().then(function(data) {
                console.log('token generated');

                connectVideo(data);  // Connect Video of local and remote users
                connectChat(data);   //connect to chat client
            });
        }
    ).catch(function(err) {
        console.log('Fetch Error : ', err);
    });
}


//----------------------------------VIDEO START--------------------------------

//connecting video to Room
async function connectVideo(data){
    await Twilio.Video.createLocalTracks().then(function(localTracks) {
        if(trackArray){
            trackArray[0].stop();
            trackArray[1].stop();
        }
        trackArray = localTracks;
        localTracks.forEach( track => {
            vidLocal.appendChild(track.attach());
        });
    });
    dataTrack = new Twilio.Video.LocalDataTrack(); //New Data track
    Twilio.Video.connect(data.jwt, {
        name: data.room,
        tracks: [dataTrack,trackArray[0],trackArray[1]]
    })
    .then(room => {        
        addRemoteUsers(room);
        connectionListeners(room);
        console.log(`Connected to Room: ${data.room}`);
    }, error => {
        console.error(`Unable to connect to Room: ${error}`);
    });
}

//connect and disconnect listeners for remote users
function connectionListeners(room) {

    // when a participant connects
    room.on('participantConnected', participant => {
        
        console.log(`A remote Participant connected: ${participant}`);
        participant.on('trackSubscribed', track => {
            if(track.kind!='data')
                vidParticipant.appendChild(track.attach());
            else{
                track.on('message', data => {
                    let p =JSON.parse(data);
                    drawPoints(p.xx, p.yy);
                });
            }
        });
    });

    // when a participant disconnects
    room.on('participantDisconnected', participant => {
        console.log(`A remote Participant disconnected: ${participant}`);
        vidParticipant.innerHTML='';
        // add video tracks of remaining participants
        room.participants.forEach(participant => {
            participant.tracks.forEach(publication => {
                if(publication.track.kind!='data')
                    vidParticipant.appendChild(publication.track.attach());
            });                
        });
    });

    // when local user disconnects
    room.on('disconnected', room => {
        vidParticipant.innerHTML='';
        vidLocal.innerHTML='';
        chat.innerHTML='';
        chatChannel.removeAllListeners();
        var old_element = sendBtn;
        var new_element = old_element.cloneNode(true);
        old_element.parentNode.replaceChild(new_element, old_element);
    });

    //remove tracks on participant disconnect
    disconnectBtn.addEventListener("click", (event) => {
        // important before disconnecting to turn off webcam
        trackArray[0].stop();
        trackArray[1].stop();
        room.disconnect();
        chatChannel.leave();
        dataTrack = null;
        clearBoard.click();
    })
}
// append participant tracks that are alredy connected
function addRemoteUsers(room) {
    room.participants.forEach(participant => {
        participant.on('trackSubscribed', track => {
            if(track.kind!='data')
                vidParticipant.appendChild(track.attach());
            else{
                track.on('message', data => {
                    let p =JSON.parse(data);
                    drawPoints(p.xx, p.yy)
                });
            }
        });
    });
}

//----------------------------------VIDEO END--------------------------------

//==========================================================================

//----------------------------------CHAT START------------------------------

// connect user chat client
function connectChat(data){
    Twilio.Chat.Client.create(data.jwt).then(chatClient => {
        _chatClient=chatClient;
        chatClient.getChannelByUniqueName(data.room)
        .then(channel => channel
        ,error => {
            if(error.body.code===50300){
                return chatClient.createChannel({
                    uniqueName: data.room,
                    friendlyName: data.room+' Chat Channel',
                });
            }
            else{
                console.log(error.body);
            }
        })
        .then(async channel => {
            await channel.join()
                .catch(err => {console.log("err: member already exists")});
            channel.getMessages().then(msg=>{
                chat.innerHTML='';
                for (i = 0; i <  msg.items.length; i++) {
                    chat.innerHTML+='<div class="sender">'+msg.items[i].author+'</div>'+
                    '<div class="single-msg">'+msg.items[i].body+'</div><br>';
                    chat.scrollTop = chat.scrollHeight - chat.clientHeight;
                }
            });
            chatChannelListeners(channel);
        })
    }, error => {
        console.error(`Unable to connect chat: ${error}`);
    });  
}

//chat listeners
function chatChannelListeners(channel){
    sendBtn = document.querySelector(".send-btn");
    sendBtn.addEventListener('click', event => {
        if(sendMessage.value!='')
            channel.sendMessage(sendMessage.value);
        sendMessage.value='';
    });
    channel.on('messageAdded', message => {
        console.log(message.author, message.body);
        chat.innerHTML+='<div class="sender">'+message.author+'</div>'+
        '<div class="single-msg">'+message.body+'</div><br>';
        chat.scrollTop = chat.scrollHeight - chat.clientHeight;
    });
    chatChannel = channel;
}

//-----------------------------------CHAT END------------------------------------------
//=====================================================================================
//-----------------------------------WHITE BOARD START---------------------------------

var canvas=document.querySelector('.white-board');
var ctx=canvas.getContext('2d');
var h=ctx.canvas.height=canvas.clientHeight;
var w=ctx.canvas.width=canvas.clientWidth;
window.addEventListener('resize', e => {
    h=ctx.canvas.height=canvas.clientHeight;
    w=ctx.canvas.width=canvas.clientWidth;
});
clearBoard.addEventListener('click', e => {
    ctx.clearRect(0,0,w,h);
})
console.log(w,h);
var offsetX = canvas.getBoundingClientRect().x;
var offsetY = canvas.getBoundingClientRect().y;

function drawPoints(x, y){
    ctx.beginPath();
    ctx.fillStyle='rgb(0, 0, 0)';
    ctx.arc(x,y,3,0,2*Math.PI);
    // ctx.stroke();
    ctx.fill();
    ctx.restore()
}

canvas.addEventListener('mousedown', event => {
    canvas.addEventListener('mousemove',drawWhiteBoard);
});
canvas.addEventListener('mouseup', event => {
    canvas.removeEventListener('mousemove',drawWhiteBoard);
});
function drawWhiteBoard(event){
    event.preventDefault();
    let xx = event.clientX-offsetX || event.targetTouches[0].clientX-offsetX;
    let yy = event.clientY-offsetY || event.targetTouches[0].clientY-offsetY;
    drawPoints(xx, yy);
    if(dataTrack){
        dataTrack.send(JSON.stringify({xx, yy}));
    }
}

canvas.addEventListener("touchmove", drawWhiteBoard);