'use strict';

let localStream = null;
let peer = null;
let existingCall = null;
let conn = null;
const datetime = new Date();

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
    debug: 1 // NONE=0,ERROR=1,WARN=2,ALL=3
});

peer.on('open', function(){
    $('#my-id').text(peer.id);
});

peer.on('error', function(err){
    alert(err.message);
});

peer.on('close', function(){
});

peer.on('disconnected', function(){
});

peer.on('connection', function(connection){
    // データ通信用に connectionオブジェクトを保存しておく
    conn = connection;
    // メッセージ受信イベントの設定
    conn.on("data", onRecvMessage);
});

peer.on('call', function(call){
    call.answer(localStream);
    setupCallEventHandlers(call);
});

$('#make-call').submit(function(e){
    e.preventDefault();
    const call = peer.call($('#callto-id').val(), localStream);
    conn = peer.connect($('#callto-id').val());
    // メッセージ受信イベントの設定
    conn.on("data", onRecvMessage);
    setupCallEventHandlers(call);
});

$('#end-call').click(function(){
    existingCall.close();
    conn.close();
});

// Sendボタンクリック時の動作
$("#send").click(function(){
    // 送信テキストの取得
    let message = $("#message").val();
    // メッセージが未入力の場合
    if(!message){
        return;
    }
    // 送信
    conn.send(message);
    // 自分の画面に表示
    $("#messages").append($("<p>").html("私: " + message));
    // 最下部に移動
    $("#messages").scrollTop($("#messages").offset().top);
    // 送信テキストボックスをクリア
    $("#message").val("");
});

$("#delete").click(function(){
    // メッセージをクリア
    $("#messages").empty();
});

// メッセージ受信イベントの設定
function onRecvMessage(data) {
    // 画面に受信したメッセージを表示
    $("#messages").append($("<p>").text(conn.remoteId + ": " + data).css("font-weight", "bold"));
    // 最下部に移動
    $("#messages").scrollTop($("#messages").offset().top);
}

function setupCallEventHandlers(call){
    if (existingCall) {
        existingCall.close();
        conn.close();
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
        $("#messages").empty();
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
    $('#send-message').hide();
}

function setupEndCallUI() {
    $('#make-call').hide();
    $('#end-call').show();
    $('#send-message').show();
}