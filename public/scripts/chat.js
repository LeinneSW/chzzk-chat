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

    let startTime = Date.now();
    chzzkChat = client.chat({
        channelId: liveDetail.channel.channelId,
        pollInterval: 10 * 1000
    });
    chzzkChat.on('connect', () => {
        startTime = Date.now();
        chzzkChat.requestRecentChat(50)
    })
    chzzkChat.on('chat', chat => {
        const nickname = chat.profile.nickname;
        const message = chat.message;
        const date = +chat.time || Date.now();

        if(startTime <= date){
            addTTSQueue(message, nickname);
        }

        const color = chat.profile.title?.color ??
            (chat.profile.streamingProperty?.nicknameColor?.colorCode !== "CC000" ?
                getCheatKeyColor(chat.profile.streamingProperty.nicknameColor.colorCode) :
                getUserColor(chat.profile.userIdHash + chat.chatChannelId))

        let emojiList = chat.extras?.emojis;
        if(!emojiList || typeof emojiList !== 'object'){
            emojiList = {};
        }

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
        alert('잘못된 형태의 치지직 채널 아이디입니다.');
        return;
    }
    document.addEventListener('click', () => addTTSQueue('TTS가 활성화 되었습니다.'))
    connectChannel(channelId);
};