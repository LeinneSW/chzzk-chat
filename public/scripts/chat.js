import {ChzzkClient} from "https://cdn.skypack.dev/chzzk"

let chzzkChat;
async function connectChannel(channelId){
    if(chzzkChat?.connected){
        chzzkChat.disconnect();
    }
    const client = new ChzzkClient({
        baseUrls: {
            chzzkBaseUrl: "/cors/chzzk",
            gameBaseUrl: "/cors/game"
        }
    });
    let liveDetail = null;
    try{
        liveDetail = await client.live.detail(channelId);
    }catch(e){
        const channelList = await client.search.channels('');
        // TODO: 채널 찾기 기능
        alert(e.message);
        return;
    }

    if(!liveDetail){
        alert('존재하지 않는 치지직 채널입니다.');
        return;
    }else{
        const avatar = document.getElementById('streamer-avatar');
        avatar.src = liveDetail.channel.channelImageUrl;

        const nickname = document.getElementById('streamer-name');
        nickname.textContent = liveDetail.channel.channelName;
        console.log(liveDetail);

        // TODO: 온라인/오프라인 기능 체크, 방제/카테고리 조회기능
    }

    let startTime = Date.now();
    chzzkChat = client.chat({
        channelId: liveDetail.channel.channelId,
        pollInterval: 10 * 1000
    });
    chzzkChat.on('connect', () => {
        startTime = Date.now();
        chzzkChat.requestRecentChat(50)
    })
    chzzkChat.on('reconnect', () => {
        startTime = Date.now();
        const chatBox = document.getElementById('chat-box');
        while(chatBox.firstChild){
            chatBox.removeChild(chatBox.firstChild);
        }
        chzzkChat.requestRecentChat(50)
    })
    chzzkChat.on('chat', chat => {
        const nickname = chat.profile.nickname;
        const message = chat.message;
        const date = +chat.time || Date.now();

        if(startTime <= date){
            addTTSQueue(message, nickname);
        }

        const streamingProperty = chat.profile.streamingProperty || {};
        const color = chat.profile.title?.color ??
            (streamingProperty.nicknameColor?.colorCode !== "CC000" ?
                getCheatKeyColor(streamingProperty.nicknameColor.colorCode) :
                getUserColor(chat.profile.userIdHash + chat.chatChannelId))

        let emojiList = chat.extras?.emojis;
        if(!emojiList || typeof emojiList !== 'object'){
            emojiList = {};
        }

        const badgeList = []
        if(chat.profile?.badge?.imageUrl){
            badgeList.push(chat.profile.badge.imageUrl)
        }
        if(streamingProperty.realTimeDonationRanking?.badge?.imageUrl){
            badgeList.push(streamingProperty.realTimeDonationRanking.badge.imageUrl)
        }
        if(streamingProperty.subscription?.badge?.imageUrl){
            badgeList.push(streamingProperty.subscription.badge.imageUrl)
        }
        for(const viewerBadge of chat.profile.viewerBadges){
            badgeList.push(viewerBadge.badge.imageUrl)
        }
        addMessageBox(nickname, message, date, color, emojiList, badgeList);
    });
    try{
        await chzzkChat.connect();
    }catch{}
}

window.onload = async () => {
    const params = new URLSearchParams(location.search);
    let channelId = params.get('channelId') || params.get('channel')  || params.get('id');

    if(!channelId){
        while(!channelId){
            channelId = prompt('치지직 채널 ID를 입력해주세요');
        }
        const url = new URL(location.href);
        url.searchParams.set('channelId', channelId);
        location.href = url.toString();
        return;
    }else if(typeof channelId !== 'string' || channelId.length !== 32){
        alert('올바른 치지직 채널 아이디가 아닙니다.');
        return;
    }
    document.addEventListener('click', () => addTTSQueue('TTS가 활성화 되었습니다.'))
    connectChannel(channelId);
};