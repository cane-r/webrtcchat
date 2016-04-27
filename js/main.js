'use strict';

var sendChannel;
/*

m.onkeypress=call;
m.onKeypress=call;
m.onKeyPress=call;

function call(e)

{
 var evt=e.keyCode || e.keycode || e.which;
if(evt==13){
  sendM();
  //b.click();
}

}

*/


var isChannelReady;
var remoteStream;
var isTurnReady;

var localStream;
var pc;

var isChrome = !!navigator.webkitGetUserMedia;
var isInitiator=false;
var isStarted;

var STUN = {
    url: isChrome 
       ? 'stun:stun.l.google.com:19302' 
       : 'stun:23.21.150.121'
};

var TURN = {
    url: 'turn:turn.bistri.com:80',
    credential: 'homeo',
    username:'homeo'

};


var TURN2 = {
    url: 'turn:numb.viagenie.ca',
    credential: 'caner19888891',
    username:'canersir@gmail.com'

};


var TURN3 = {
    url: 'turn:turn.anyfirewall.com:443?transport=tcp',
    credential: 'webrtc',
    username:'webrtc'

};


var pc_config = {
   iceServers: [STUN, TURN,TURN2,TURN3]
};


/*
  var pc_config = 
  {'iceServers':
  
  [ 
  {'url':'stun:stun.anyfirewall.com:3478'},
  {'url':'turn:webrtc@turn.anyfirewall.com:443?transport=tcp,credential:webrtc'},
  {'url':'turn:webrtc@live.com@numb.viagenie.ca,credential:muazkh'}
  ]

  }; 
  */
  
/*
  {'url':'turn:canersir@gmail.com@numb.viagenie.ca,credential:caner19888891'},
  {'url':'stun:stun.anyfirewall.com:3478'},
  {'url':'stun:23.21.150.121'}, 
  {'url':'stun:stun.l.google.com:19302'},
  {'url':'stun:stun1.l.google.com:19302'},
  {'url':'turn:homeo@turn.bistri.com:80,credential:homeo'},
  {'url':'turn:webrtc@live.com@numb.viagenie.ca,credential:muazkh'},
  {'url':'turn:louis@mozilla.com@numb.viagenie.ca,credential:webrtcdemo'}   
  {'url':'stun:stun.anyfirewall.com:3478'},
  {'url':'stun:23.21.150.121'}, 
  {'url':'stun:stun.l.google.com:19302'},
  {'url':'stun:stun1.l.google.com:19302'},
  {'url':'turn:homeo@turn.bistri.com:80,credential:homeo'},
  {'url':'turn:webrtc@live.com@numb.viagenie.ca,credential:muazkh'},
  {'url':'turn:louis@mozilla.com@numb.viagenie.ca,credential:webrtcdemo'},
  {'url':'turn:webrtc@turn.anyfirewall.com:443?transport=tcp,credential:webrtc'},

var STUN = {
    url: isChrome 
       ? 'stun:stun.l.google.com:19302' 
       : 'stun:23.21.150.121'
};

var TURN = {
    url: 'turn:homeo@turn.bistri.com:80',
    credential: 'homeo'
};

var iceServers = {
   iceServers: [STUN, TURN]
};


*/ 

    

var pc_constraints = {
  'optional': [
    {'DtlsSrtpKeyAgreement': true},
    {'RtpDataChannels': true}
  ]};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {'mandatory': {
  'OfferToReceiveAudio':true,
  'OfferToReceiveVideo':true }};

/////////////////////////////////////////////

//var socket = io.connect("http://127.0.0.1:8443");

//var socket = io.connect("https://webrtcchat-redhatappv2.rhcloud.com:8443 ",{secure: true});
var socket = io.connect("https://webrtcchat-redhatappv2.rhcloud.com:8443");
var room;


//setTimeout(function(){ socket.emit("search","");},100);
/* 
window.onload=function(){
  //socket.emit("search","");
setTimeout(function(){ socket.emit("search","");},1000);
}
*/
$(document).ready(function(){
    //setTimeout(function(){ socket.emit("search","");},1000);
    socket.emit("search","");
});



//b.onclick=sendM;

socket.on("found", function (data){
  room=data;
  console.log("Room is " + data);
  
  if (data !== '') {
    

socket.emit('create or join', data);


}
else{

  alert("No room found.Refresh page?..")
}

});


socket.on('created', function (room){
  console.log('Created room ' + room);
  isInitiator = true;
});


socket.on('full', function (room){
  console.log('Room ' + room + ' is full');
  socket.emit("search","");

});

socket.on('join', function (room){
  console.log('A join request ..' + room);
  //console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});

socket.on('joined', function (room){
  console.log('Joined room ' + room);
  isChannelReady = true;
});

socket.on('log', function (array){
  console.log.apply(console, array);
});

socket.on("change", function (data){
  console.log("Received change initiator command..");
  console.log("Old value of isInitiator : " + isInitiator );
  isInitiator=data;
  console.log("New value of isInitiator : " + isInitiator );
  var pc;
});

////////////////////////////////////////////////

function sendMessage(message){
	console.log('Sending message: ' + message);
  socket.emit('message', message,room);
}


socket.on('message', function (message){
  //setTimeout(function(){console.log('Received message:' + message.toString());},100);
  console.log('Received message:' + message.toString());
  if (message === 'usermedia') {
  	maybeStart();
  } 

  else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({sdpMLineIndex:message.label,
      candidate:message.candidate});
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});

////////////////////////////////////////////////////

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

//sometimes buggy..
function handleUserMedia(stream) {
  localStream = stream;
  attachMediaStream(localVideo, stream);
  console.log('Adding local stream.');
  sendMessage('usermedia');
  if (isInitiator) {
    maybeStart();
  }
}

function handleUserMediaError(error){
  console.log('getUserMedia error: ', error);
}

var constraints = {video: true,audio:true};

getUserMedia(constraints, handleUserMedia, handleUserMediaError);
console.log('Getting user media with constraints', constraints);

if (location.hostname != "localhost") {
  requestTurn("https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913");
}


function maybeStart() {
  if (!isStarted && localStream && isChannelReady) {
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    if (isInitiator) {
      doCall();
    }
  }
}

function signal(){
  console.log("Sending change initiator command..")
  if(isInitiator){
  socket.emit("init",isInitiator,room);
  }
}

window.onbeforeunload = function(e){
  signal();
  socket.emit("leaved",room);
	sendMessage('bye');
  
}

/////////////////////////////////////////////////////////

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pc_config, pc_constraints);
    pc.onicecandidate = handleIceCandidate;
    console.log('Created RTCPeerConnnection with:\n' +
      '  config: \'' + JSON.stringify(pc_config) + '\';\n' +
      '  constraints: \'' + JSON.stringify(pc_constraints) + '\'.');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
      return;
  }
  pc.onaddstream = handleRemoteStreamAdded;
  pc.onremovestream = handleRemoteStreamRemoved;
/*
  if (isInitiator) {
    try {
      // Reliable Data Channels not yet supported in Chrome
      sendChannel = pc.createDataChannel("sendDataChannel",
        {reliable: false});
      sendChannel.onmessage = handleMessage;
      trace('Created send data channel');
    } catch (e) {
      alert('Failed to create data channel. ' +
            'You need Chrome M25 or later with RtpDataChannel enabled');
      trace('createDataChannel() failed with exception: ' + e.message);
    }
    sendChannel.onopen = handleSendChannelStateChange;
    sendChannel.onclose = handleSendChannelStateChange;
  } else {
    pc.ondatachannel = gotReceiveChannel;
  }
  */
}



function handleIceCandidate(event) {
  console.log('handleIceCandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate});
  } else {
    console.log('End of candidates.');
  }
}

function doCall() {
  var constraints = {'optional': [], 'mandatory': {'MozDontOfferDataChannel': true}};
  // temporary measure to remove Moz* constraints in Chrome
  if (webrtcDetectedBrowser === 'chrome') {
    for (var prop in constraints.mandatory) {
      if (prop.indexOf('Moz') !== -1) {
        delete constraints.mandatory[prop];
      }
     }
   }
  constraints = mergeConstraints(constraints, sdpConstraints);
  console.log('Sending offer to peer, with constraints: \n' +
    '  \'' + JSON.stringify(constraints) + '\'.');
  pc.createOffer(setLocalAndSendMessage, null, constraints);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer(setLocalAndSendMessage, handleCreateAnswerError, sdpConstraints);
}

function mergeConstraints(cons1, cons2) {
  var merged = cons1;
  for (var name in cons2.mandatory) {
    merged.mandatory[name] = cons2.mandatory[name];
  }
  merged.optional.concat(cons2.optional);
  return merged;
}


function handleCreateAnswerError(error) {
  console.log('createAnswer() error: ', error);
}

function setLocalAndSendMessage(sessionDescription) {
  // Set Opus as the preferred codec in SDP if Opus is present.
  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
  pc.setLocalDescription(sessionDescription);
  sendMessage(sessionDescription);
}

function requestTurn(turn_url) {
  var turnExists = false;
  for (var i in pc_config.iceServers) {
    if (pc_config.iceServers[i].url.substr(0, 5) === 'turn:') {
      turnExists = true;
      isTurnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turn_url);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    /*
            pc_config.iceServers.push({
          'url': 'turn:' + 1445279669:UProxy + '@' + 23.251.129.26:3478?transport=udp,
          'credential': kTuBVAATLbe3r0eqeoJgBs6dgHQ=
        });
            pc_config.iceServers.push({
          'url': 'turn:' + 1445279669:UProxy + '@' + 23.251.129.26:3478?transport=udp,
          'credential': kTuBVAATLbe3r0eqeoJgBs6dgHQ=
        });

            pc_config.iceServers.push({
          'url': 'turn:' + 1445279669:UProxy + '@' + 23.251.129.26:3478?transport=udp,
          'credential': kTuBVAATLbe3r0eqeoJgBs6dgHQ=
        });
            isTurnReady=true
*/
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
      	console.log('Got TURN server: ', turnServer);
        pc_config.iceServers.push({
          'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
          


        isTurnReady = true;
      }
    };
    console.log("Assuming get request..");
    xhr.open('GET', turn_url, true);
     console.log("Assumed get request..");
    xhr.send();
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
 // reattachMediaStream(miniVideo, localVideo);
  attachMediaStream(remoteVideo, event.stream);
  remoteStream = event.stream;
//  waitForRemoteVideo();
}
function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  
}

function stop() {
  isStarted = false;
  // isAudioMuted = false;
  // isVideoMuted = false;
  pc.close();
  pc = null;
}

/////////////dont care after here...//////////////////////////////

// Set Opus as the default audio codec if it's present.
function preferOpus(sdp) {
  var sdpLines = sdp.split('\r\n');
  var mLineIndex;
  // Search for m line.
  for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('m=audio') !== -1) {
        mLineIndex = i;
        break;
      }
  }
  if (mLineIndex === null) {
    return sdp;
  }

  // If Opus is available, set it as the default in m line.
  for (i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('opus/48000') !== -1) {
      var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
      if (opusPayload) {
        sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
      }
      break;
    }
  }

  // Remove CN in m line and sdp.
  sdpLines = removeCN(sdpLines, mLineIndex);

  sdp = sdpLines.join('\r\n');
  return sdp;
}

function extractSdp(sdpLine, pattern) {
  var result = sdpLine.match(pattern);
  return result && result.length === 2 ? result[1] : null;
}

// Set the selected codec to the first in m line.
function setDefaultCodec(mLine, payload) {
  var elements = mLine.split(' ');
  var newLine = [];
  var index = 0;
  for (var i = 0; i < elements.length; i++) {
    if (index === 3) { // Format of media starts from the fourth.
      newLine[index++] = payload; // Put target payload to the first.
    }
    if (elements[i] !== payload) {
      newLine[index++] = elements[i];
    }
  }
  return newLine.join(' ');
}

// Strip CN from sdp before CN constraints is ready.
function removeCN(sdpLines, mLineIndex) {
  var mLineElements = sdpLines[mLineIndex].split(' ');
  // Scan from end for the convenience of removing an item.
  for (var i = sdpLines.length-1; i >= 0; i--) {
    var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
    if (payload) {
      var cnPos = mLineElements.indexOf(payload);
      if (cnPos !== -1) {
        // Remove CN payload from m line.
        mLineElements.splice(cnPos, 1);
      }
      // Remove CN line in sdp
      sdpLines.splice(i, 1);
    }
  }

  sdpLines[mLineIndex] = mLineElements.join(' ');
  return sdpLines;
}

