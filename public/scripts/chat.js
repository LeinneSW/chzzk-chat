import {ChzzkClient} from "https://cdn.skypack.dev/chzzk"

let chzzkChat;
let lastTryMillis = 0;

async function connectChannel(channelId){
    lastTryMillis = Date.now();
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
        alert(e.message);
        return;
    }

    if(!liveDetail){
        alert('채널 아이디를 올바르게 작성해주세요');
        return;
    }

    chzzkChat = client.chat({
        channelId: liveDetail.channel.channelId,
        pollInterval: 10 * 1000
    });
    chzzkChat.on('connect', () => chzzkChat.requestRecentChat(50))
    chzzkChat.on('chat', chat => {
        const badgeList = []
        if(chat.profile?.badge?.imageUrl){
            badgeList.push(chat.profile.badge.imageUrl)
        }
        if(chat.profile.streamingProperty?.realTimeDonationRanking?.badge?.imageUrl){
            badgeList.push(chat.profile.streamingProperty.realTimeDonationRanking.badge.imageUrl)
        }
        if(chat.profile.streamingProperty?.subscription?.badge?.imageUrl){
            badgeList.push(chat.profile.streamingProperty.subscription.badge.imageUrl)
        }
        for(const viewerBadge of chat.profile.viewerBadges){
            badgeList.push(viewerBadge.badge.imageUrl)
        }

        const nickname = chat.profile.nickname;
        const message = chat.message;

        const color = chat.profile.title?.color ??
            (chat.profile.streamingProperty?.nicknameColor?.colorCode !== "CC000" ?
                getCheatKeyColor(chat.profile.streamingProperty.nicknameColor.colorCode) :
                getUserColor(chat.profile.userIdHash + chat.chatChannelId))
        addMessageBox(nickname, message, +chat.time, color, chat.extras?.emojis || {}, badgeList);
        //addTTSQueue(message, nickname);
    });
    try{
        await chzzkChat.connect();
        //addTTSQueue('TTS가 활성화 되었습니다.');
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
        alert('잘못된 형태의 치지직 채널 아이디입니다.');
        return;
    }
    connectChannel(channelId);
};