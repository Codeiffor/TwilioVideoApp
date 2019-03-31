document.querySelector(".connect-btn").addEventListener("click", (event) => {
    connectUser();
})
function connectUser(){
    var name = document.querySelector(".name").value;
    var _room = document.querySelector(".roomname").value;
    fetch(window.location.origin+"/accesstoken/"+_room+"/"+name)
        .then(function(response) {
            if (response.status !== 200) {
                console.log('Looks like there was a problem. Status Code: ' +response.status);
                return;
            }
            response.json().then(function(data) {
                console.log(data);
                connectVideo(data, _room);
            });
        }
    ).catch(function(err) {
        console.log('Fetch Error : ', err);
    });
}
function connectVideo(data, _room){
    Twilio.Video.connect(data.jwt, {
        audio: true,
        name: _room,
        video: { width: 640 }
    }).then(room => {
        console.log(`Connected to Room: ${_room}`);

        room.on('participantConnected', participant => {
            console.log(`A remote Participant connected: ${participant}`);
            participant.on('trackSubscribed', track => {
                document.querySelector('.vid2').appendChild(track.attach());
            });
        });

        setVideo(room);

        room.on('participantDisconnected', participant => {
            document.querySelector('.vid2').innerHTML='';
        });

        room.on('disconnected', room => {
            room.localParticipant.tracks.forEach(publication => {
              var attachedElements = publication.track.detach();
              attachedElements.forEach(element => element.remove());
              document.querySelector('.vid1').innerHTML='';
              document.querySelector('.vid2').innerHTML='';
            });
        });
        
        document.querySelector(".disconnect-btn").addEventListener("click", (event) => {
            room.disconnect();
        })
        }, error => {
        console.error(`Unable to connect to Room: ${error.message}`);
    });
}
function setVideo(room){
    Twilio.Video.createLocalTracks().then(function(localTracks) {
        var localMediaContainer = document.querySelector('.vid1');
        localTracks.forEach(function(track) {
            localMediaContainer.appendChild(track.attach());
        });
    });
    room.participants.forEach(participant => {
        participant.on('trackSubscribed', track => {
                document.querySelector('.vid2').appendChild(track.attach());
            });
        // participant.tracks.forEach(publication => {
        // if (publication.isSubscribed) {
        //     console.log(publication)
        //     var track = publication.track;
        //     document.querySelector('.vid2').appendChild(track.attach());
        //     }
        // });
    });
}