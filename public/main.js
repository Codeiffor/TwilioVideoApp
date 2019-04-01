document.querySelector(".connect-btn").addEventListener("click", (event) => {
    connectUser();
})
var trackArray;
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
            document.querySelector('.vid1').innerHTML='<div class="vid2" style="position:absolute; width:20%; bottom:1%; right:1%"></div>';
            document.querySelector('.vid2').innerHTML='';
        });
        
        document.querySelector(".disconnect-btn").addEventListener("click", (event) => {
            trackArray[0].stop();
            trackArray[1].stop();
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
        trackArray = localTracks;
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