import {ChzzkClient} from "https://cdn.skypack.dev/chzzk"

let chzzkChat;
let liveStatus;

const client = new ChzzkClient({
    baseUrls: {
        chzzkBaseUrl: "/cors/chzzk",
        gameBaseUrl: "/cors/game"
    }
});
const checkLiveState = async (channelId) => {
    const beforeLiveStatus = liveStatus;
    try{
        liveStatus = await client.live.status(channelId);
    }catch(e){}
    if(liveStatus == null || typeof liveStatus !== 'object'){
        return;
    }

    const isOffline = liveStatus.status !== 'OPEN';
    const avatar = document.getElementById('streamer-avatar');
    avatar.className = isOffline ? 'offline' : '';

    const divider = document.getElementById('divider');
    const userCount = document.getElementById('user-count');
    const liveTitle = document.getElementById('live-title');
    const liveCategory = document.getElementById('live-category');
    if(isOffline){
        divider.textContent = '';
        liveTitle.textContent = '';
        liveCategory.textContent = '';
        userCount.innerHTML = '';
    }else{
        divider.textContent = '|';
        liveTitle.textContent = liveStatus.liveTitle;
        liveCategory.textContent = liveStatus.liveCategoryValue;
        userCount.innerHTML = `<div></div>${liveStatus.concurrentUserCount}`;
    }

    if(!!liveStatus.chatChannelId && liveStatus.chatChannelId !== beforeLiveStatus?.chatChannelId){
        if(!!beforeLiveStatus?.chatChannelId){
            clearChatBox();
        }
        connectChannel();
    }
}

const clearChatBox = () => {
    const chatBox = document.getElementById('chat-container');
    while(chatBox.firstChild){
        chatBox.removeChild(chatBox.firstChild);
    }
}

const connectChannel = () => {
    if(chzzkChat?.connected){
        chzzkChat.disconnect();
    }

    let startTime = Date.now();
    chzzkChat = client.chat({
        chatChannelId: liveStatus.chatChannelId,
        pollInterval: 0,
    });
    chzzkChat.on('connect', () => {
        startTime = Date.now();
        chzzkChat.requestRecentChat(50)
    })
    chzzkChat.on('notice', notice => {
        const noticeContainer = document.getElementById('notice-container');
        if(!notice || typeof notice !== 'object'){
            noticeContainer.classList.add('hide');
        }else{
            noticeContainer.classList.remove('hide');
            noticeContainer.innerHTML = `<div>${notice.extras.registerProfile.nickname}님이 고정</div><div>${notice.message}</div>`;
            noticeContainer.onclick = () => {
                fetch('/notice', {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        channelId: chzzkChat?.chatChannelId,
                    })
                })
                    .then(async (res) => {
                        const data = await res.json();
                        if(res.ok && data.code === 200){
                            noticeContainer.onclick = () => {};
                        }else{
                            showToast('공지 제거 실패! 권한이 없습니다.')
                        }
                    })
                    .catch(() => showToast('공지 제거 실패! 권한이 없습니다.'))
            }
        }
    })
    chzzkChat.on('chat', chat => {
        const message = chat.message;
        const date = +chat.time || Date.now();

        if(startTime <= date){
            addTTSQueue(message, chat.profile.nickname);
        }

        let colorData;
        const streamingProperty = chat.profile.streamingProperty;
        if(chat.profile.title){ // 스트리머, 매니저 등 특수 역할
            colorData = chat.profile.title.color;
        }else{
            colorData = convertColorCode(
                streamingProperty.nicknameColor.colorCode,
                chat.profile.userIdHash,
                chzzkChat.chatChannelId
            );
        }

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
        addMessageBox(chat.profile, message, date, colorData, emojiList, badgeList);
    });
    chzzkChat.connect().catch(() => {});
}

const redirectChannel = (channelId) => {
    const url = new URL(location.href);
    url.searchParams.set('channelId', channelId);
    location.href = url.toString();
}

window.addEventListener('load', async () => {
    const params = new URLSearchParams(location.search);
    let channelId = params.get('channelId') || params.get('channel')  || params.get('id');
    if(!channelId){
        while(!channelId){
            channelId = prompt('치지직 채널 ID 혹은 닉네임을 입력해주세요');
        }
        redirectChannel(channelId);
        return;
    }
    document.onclick = () => {
        addTTSQueue('TTS 활성화');
        document.onclick = () => {};
    }

    let liveDetail;
    try{
        liveDetail = await client.live.detail(channelId);
    }catch(e){}
    if(liveDetail == null || typeof liveDetail !== 'object'){
        const channelList = await client.search.channels(channelId);
        let channel = channelList.channels.find(channel => channel.channelName === channelId);
        if(!channel){
            channel = channelList.channels[0];
        }
        if(!channel){
            alert('존재하지 않는 채널 혹은 한번도 방송하지 않은 채널입니다.');
        }else{
            redirectChannel(channel.channelId);
        }
        return;
    }

    // 공지 기능
    const chatContainer = document.getElementById('chat-container');
    const noticeButton = document.getElementById('notice-button');
    noticeButton.onclick = () => {
        chatContainer.classList.toggle('select-notice');
        if(chatContainer.classList.contains('select-notice')){
            showToast('고정을 원하는 메시지를 선택해주세요');
            chatContainer.onclick = (e) => {
                const messageBox = e.target.closest('.message-box'); // 가장 가까운 .message-box 탐색
                if(!messageBox) return;

                chatContainer.onclick = () => {};
                chatContainer.classList.remove('select-notice');
                fetch('/notice', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        channelId: chzzkChat?.chatChannelId,
                        messageTime: +messageBox.id,
                        messageUserIdHash: messageBox.dataset.userIdHash,
                        streamingChannelId: liveStatus?.channelId
                    })
                })
                    .then(async (res) => {
                        const data = await res.json();
                        if(!res.ok || data.code !== 200){
                            showToast('공지 등록 실패! 권한이 없습니다.')
                        }
                    })
                    .catch(() => showToast('공지 등록 실패! 권한이 없습니다.'))
            };
        }else{
            chatContainer.onclick = () => {};
        }
    }

    // 채널명, 프사 취득하기
    const avatar = document.getElementById('streamer-avatar');
    avatar.onerror = () => {
        avatar.src = 'https://ssl.pstatic.net/cmstatic/nng/img/img_anonymous_square_gray_opacity2x.png?type=f120_120_na';
    };
    avatar.src = liveDetail.channel.channelImageUrl || avatar.src;

    const nickname = document.getElementById('streamer-name');
    nickname.textContent = liveDetail.channel.channelName;

    await checkLiveState(channelId);
    setInterval(() => checkLiveState(channelId), 10 * 1000);
});