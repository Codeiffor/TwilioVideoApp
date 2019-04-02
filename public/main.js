var trackArray;

//call connectUser to get token on button click
document.querySelector(".connect-btn").addEventListener("click", (event) => {
    document.querySelector(".disconnect-btn").click()
    connectUser();
})

//GET token and call connectVideo

function connectUser(){
    var name = document.querySelector(".name").value;
    var _room = document.querySelector(".roomname").value;
    fetch(window.location.origin+"/accesstoken/"+_room+"/"+name)
        .then(function(response) {
            if (response.status !== 200) {
                console.log('Problem Status Code: ' +response.status);
                return;
            }
            response.json().then(function(data) {
                console.log('token generated');
                connectVideo(data, _room);
            });
        }
    ).catch(function(err) {
        console.log('Fetch Error : ', err);
    });
}

//connecting to Room

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
        console.log(`Connected to Room: ${_room}`);
        connectionListeners(room);
        setVideo(room);
    }, error => {
        console.error(`Unable to connect to Room: ${error.message}`);
    });
}

//setting video on page
async function setVideo(room){
    await Twilio.Video.createLocalTracks().then(function(localTracks) {
        trackArray = localTracks;
        localTracks.forEach( track => {
            document.querySelector('.vidLocal').appendChild(track.attach());
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
            document.querySelector('.vidParticipant').appendChild(track.attach());
        });
    });

    // when a participant disconnects
    room.on('participantDisconnected', participant => {
        console.log(`A remote Participant disconnected: ${participant}`);
        document.querySelector('.vidParticipant').innerHTML='';
        room.participants.forEach(participant => {
            participant.tracks.forEach(publication => {
                document.querySelector('.vidParticipant').appendChild(publication.track.attach());
            });                
        });
    });

    // when user disconnects
    room.on('disconnected', room => {
        document.querySelector('.vidParticipant').innerHTML='';
        document.querySelector('.vidLocal').innerHTML='';
    });

    //remove tracks on participant disconnect
    document.querySelector(".disconnect-btn").addEventListener("click", (event) => {
        trackArray[0].stop();
        trackArray[1].stop();
        room.disconnect();
    })
}
// append participant tracks that are alredy connected
function addRemoteUsers(room) {
    room.participants.forEach(participant => {
        participant.on('trackSubscribed', track => {
            document.querySelector('.vidParticipant').appendChild(track.attach());
        });
    });
}