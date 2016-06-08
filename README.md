Random(not random really)video call system built with Node.js&WebRtc


Example deployment here : https://webrtcchat-redhatappv2.rhcloud.com

Open the page in two browser tab(In firefox,two tabs cannot share the webcam I suppose) and dont get shy to look at browser console :)

Sometimes the callee and caller doesnt get matched due to NAT problem(Turn,Stun or ICE fails)Reload the second tab to overcome this situation(I am working on a fix about this)

Http(http://webrtcchat-redhatappv2.rhcloud.com) version is not working as getUserMedia function is not permitted on non-secure origins.
