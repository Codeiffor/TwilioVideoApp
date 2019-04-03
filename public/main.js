var trackArray;
var vidParticipant = document.querySelector('.vidParticipant');
var vidLocal = document.querySelector('.vidLocal');
var disconnectBtn = document.querySelector(".disconnect-btn");
var connectBtn = document.querySelector(".connect-btn");

//call getUserToken to get token on button click
connectBtn.addEventListener("click", (event) => {
    disconnectBtn.click()
    getUserToken();
})

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

                connectVideo(data, _room);  // Connect Video of local and remote users
                // connectChat();   //connect to chat client
            });
        }
    ).catch(function(err) {
        console.log('Fetch Error : ', err);
    });
}

//connecting video to Room
function connectVideo(data, _room){
    Twilio.Video.connect(data.jwt, {
        audio: true,
        name: _room,
        video: { width: 640 }
    })
    .then(room => {
        if(trackArray){
            trackArray[0].stop();
            trackArray[1].stop();
        }

        addVideoTracks(room);   // adding video tracks to room

        connectionListeners(room);
        console.log(`Connected to Room: ${_room}`);
    }, error => {
        console.error(`Unable to connect to Room: ${error.message}`);
    });
}

//add video tracks on page
async function addVideoTracks(room){
    await Twilio.Video.createLocalTracks().then(function(localTracks) {
        trackArray = localTracks;
        localTracks.forEach( track => {
            vidLocal.appendChild(track.attach());
        });
        addRemoteUsers(room);
    });
}

//connect and disconnect listeners for remote users
function connectionListeners(room) {

    // when a participant connects
    room.on('participantConnected', participant => {
        
        console.log(`A remote Participant connected: ${participant}`);
        participant.on('trackSubscribed', track => {
            vidParticipant.appendChild(track.attach());
        });
    });

    // when a participant disconnects
    room.on('participantDisconnected', participant => {
        console.log(`A remote Participant disconnected: ${participant}`);
        vidParticipant.innerHTML='';
        // add video tracks of remaining participants
        room.participants.forEach(participant => {
            participant.tracks.forEach(publication => {
                vidParticipant.appendChild(publication.track.attach());
            });                
        });
    });

    // when local user disconnects
    room.on('disconnected', room => {
        vidParticipant.innerHTML='';
        vidLocal.innerHTML='';
    });

    //remove tracks on participant disconnect
    disconnectBtn.addEventListener("click", (event) => {
        // important before disconnecting to turn off webcam
        trackArray[0].stop();
        trackArray[1].stop();
        room.disconnect();
    })
}
// append participant tracks that are alredy connected
function addRemoteUsers(room) {
    room.participants.forEach(participant => {
        participant.on('trackSubscribed', track => {
            vidParticipant.appendChild(track.attach());
        });
    });
}