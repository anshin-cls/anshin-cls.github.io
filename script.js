'use strict';

let localStream = null;
let peer = null;
let existingCall = null;
let conn = null;
const datetime = new Date();

// カメラとマイクの取得
navigator.mediaDevices.getUserMedia({video: true, audio: true})
.then(function (stream) {
    $('#my-video').get(0).srcObject = stream;

    localStream = stream;
}).catch(function (error) {
    // エラーメッセージ
    console.error('mediaDevice.getUserMedia() error:', error);

    return;
});

// SkyWay との接続
peer = new Peer(
    ('000' + datetime.getMilliseconds()).slice(-3),{
    key: 'b0f8a736-9fd3-44ea-a0f0-5cf7a74c1b9d',
    debug: 1 // NONE=0,ERROR=1,WARN=2,ALL=3
});

peer.on('open', function(){
    // 自分の ID を表示
    $('#my-id').text(peer.id);
});

peer.on('error', function(err){
    //エラーメッセージ
    alert(err.message);
});

peer.on('close', function(){
});

peer.on('disconnected', function(){
});

peer.on('connection', function(connection){
    // テキストチャットオブジェクトの保存
    conn = connection;

    // メッセージ受信イベントの設定
    conn.on("data", onRecvMessage);
});

peer.on('call', function(call){
    // 通話リクエストへの応答
    call.answer(localStream);

    // 通話イベントハンドラ
    setupCallEventHandlers(call);
});

$('#make-call').submit(function(e){
    // デフォルト
    e.preventDefault();

    // ビデオチャット
    const call = peer.call($('#callto-id').val(), localStream);

    // テキストチャット
    conn = peer.connect($('#callto-id').val());

    // テキストメッセージ受信イベントの設定
    conn.on("data", onRecvMessage);

    // 通話イベントハンドラ
    setupCallEventHandlers(call);
});

$('#end-call').click(function(){
    // ビデオチャットオブジェクトの削除
    existingCall.close();

    // テキストチャットオブジェクトの削除
    conn.close();
});

// Sendボタンクリック時の動作
$("#send").click(function(){
    // 送信テキストの取得
    let message = $("#message").val();

    // メッセージが未入力の場合
    if(message.length == 0){
        return;
    }

    // テキストの送信
    conn.send(message);

    // テキストチャットに送信したメッセージを表示
    $("#messages").append($("<p>").html("私: " + message));

    // テキストチャットの最下部に移動
    $("#messages").scrollTop($("#messages").offset().top);

    // 送信テキストボックスをクリア
    $("#message").val("");
});

// deleteボタンクリック時の動作
$("#delete").click(function(){
    // テキストチャットメッセージを消去
    $("#messages").empty();
});

// メッセージ受信イベントの設定
function onRecvMessage(data) {
    // テキストチャットに受信したメッセージを表示
    $("#messages").append($("<p>").text(conn.remoteId + ": " + data).css("font-weight", "bold"));

    // テキストチャットの最下部に移動
    $("#messages").scrollTop($("#messages").offset().top);
}

// ビデオチャットのイベントハンドラ
function setupCallEventHandlers(call){
    // 既に通話中の場合
    if (existingCall) {
        // この仕様は変更するかもしれない
        // ビデオチャットのオブジェクトの削除
        existingCall.close();

        // テキストチャットオブジェクトの削除
        conn.close();
    };

    // ビデオチャットオブジェクトの取得
    existingCall = call;

    // 着信に応答
    call.on('stream', function(stream){
        // ビデオの取得
        addVideo(call,stream);

        // 通話時の UI に変更
        setupEndCallUI();

        // 相手の ID を表示
        $('#their-id').text(call.remoteId);
    });

    // 通話の終了
    call.on('close', function(){
        // ビデオの削除
        removeVideo(call.remoteId);

        // 初期の UI に変更
        setupMakeCallUI();

        // メッセージの消去
        // 必要かどうか検討する
        $("#messages").empty();
    });
}

// ビデオの取得
function addVideo(call,stream){
    $('#their-video').get(0).srcObject = stream;
}

// ビデオの削除
function removeVideo(peerId){
    $('#their-video').get(0).srcObject = undefined;
}

// 通話時の UI
function setupMakeCallUI(){
    $('#make-call').show();

    $('#end-call').hide();

    $('#send-message').hide();
}

// 通常時の UI
function setupEndCallUI() {
    $('#make-call').hide();

    $('#end-call').show();

    $('#send-message').show();
}