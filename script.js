'use strict';

let localStream = null;
let peer = null;
let existingCall = null;

let datetime = new Date();

navigator.mediaDevices.getUserMedia({video: true, audio: true})
.then(function (stream) {
    // Success
    $('#my-video').get(0).srcObject = stream;
    localStream = stream;
}).catch(function (error) {
    // Error
    console.error('mediaDevice.getUserMedia() error:', error);
    return;
});

peer = new Peer(
    ('000' + datetime.getMilliseconds()).slice(-3),{
    key: 'b0f8a736-9fd3-44ea-a0f0-5cf7a74c1b9d',
    debug: 1
    // NONE=0,ERROR=1,WARN=2,ALL=3
});

peer.on('open', function(){
    $('#my-id').text(peer.id);
});

peer.on('error', function(err){
    alert(err.message);
});

peer.on('call', function(call){
    call.answer(localStream);
    setupCallEventHandlers(call);
});

peer.on('close', function(){
});

peer.on('disconnected', function(){
});

$('#make-call').submit(function(e){
    e.preventDefault();
    const call = peer.call($('#callto-id').val(), localStream);
    setupCallEventHandlers(call);
});

$('#end-call').click(function(){
    existingCall.close();
});

function setupCallEventHandlers(call){
    if (existingCall) {
        existingCall.close();
    };

    existingCall = call;

    call.on('stream', function(stream){
        addVideo(call,stream);
        setupEndCallUI();
        $('#their-id').text(call.remoteId);
    });

    call.on('close', function(){
        removeVideo(call.remoteId);
        setupMakeCallUI();
        alert('通話が終了しました。');
    });
}

function addVideo(call,stream){
    $('#their-video').get(0).srcObject = stream;
}

function removeVideo(peerId){
    $('#their-video').get(0).srcObject = undefined;
}

function setupMakeCallUI(){
    $('#make-call').show();
    $('#end-call').hide();
}

function setupEndCallUI() {
    $('#make-call').hide();
    $('#end-call').show();
}