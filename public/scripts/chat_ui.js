const escapeHTML = (text) => text.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatTime = (msecs) => {
    msecs = new Date(msecs)
    const h = String(msecs.getHours()).padStart(2, '0')
    const m = String(msecs.getMinutes()).padStart(2, '0')
    return `[${h}:${m}]`
}

const addMessageBox = (nickname, message, msecs = Date.now(), color = 'white', emojiList = {}, badgeList = []) => {
    const chatBox = document.getElementById('chat-box');
    const messageBoxDiv = document.createElement('div')
    messageBoxDiv.id = msecs + ''
    messageBoxDiv.className = 'message-box'
    chatBox.appendChild(messageBoxDiv)

    const timeSpan = document.createElement('span')
    timeSpan.className = 'time'
    timeSpan.textContent = formatTime(msecs);
    messageBoxDiv.appendChild(timeSpan);

    for(const badgeUrl of badgeList){
        const badgeImg = document.createElement('img')
        badgeImg.alt = 'badge'
        badgeImg.src = badgeUrl
        messageBoxDiv.appendChild(badgeImg)
    }

    const userSpan = document.createElement('span')
    userSpan.className = 'nickname'
    userSpan.innerText = nickname
    userSpan.style.color = color
    messageBoxDiv.appendChild(userSpan)

    const messageSpan = document.createElement('span')
    messageSpan.className = 'message'

    message = escapeHTML(message)
    for(const emojiName in emojiList){
        message = message.replaceAll(`{:${emojiName}:}`, `<img src='${emojiList[emojiName]}' alt="emoji">`)
    }
    messageSpan.innerHTML = ` : ${message}`
    messageBoxDiv.appendChild(messageSpan)

    chatBox.scrollTop = chatBox.scrollHeight
}

const nicknameColors = [
    "#EEA05D", "#EAA35F", "#E98158", "#E97F58", "#E76D53", "#E66D5F", "#E16490", "#E481AE", "#E481AE", "#D25FAC",
    "#D263AE", "#D66CB4", "#D071B6", "#AF71B5", "#A96BB2", "#905FAA", "#B38BC2", "#9D78B8", "#8D7AB8", "#7F68AE",
    "#9F99C8", "#717DC6", "#7E8BC2", "#5A90C0", "#628DCC", "#81A1CA", "#ADD2DE", "#83C5D6", "#8BC8CB", "#91CBC6",
    "#83C3BB", "#7DBFB2", "#AAD6C2", "#84C194", "#92C896", "#94C994", "#9FCE8E", "#A6D293", "#ABD373", "#BFDE73"
]

const cheatKeyNicknameColors = [
    "#E2BE61", "#ECA843", "#EC8A43", "#EA723D", "#E56B79", "#E68199", "#E16CB5", "#BC7ACC", "#A983E7", "#8B89E1",
    "#7194EE", "#7994D0", "#71AAED", "#5FB7E8", "#80BDD3", "#80D3CE", "#99D3BA", "#94D59A", "#BBE69A", "#CCE57D"
]

const getUserColor = (seed) => {
    const index = seed.split("")
        .map((c) => c.charCodeAt(0))
        .reduce((a, b) => a + b, 0) % nicknameColors.length
    return nicknameColors[index]
}

const getCheatKeyColor = (code) => {
    const colorCode = parseInt(code.replace("CC", ""))
    return cheatKeyNicknameColors[colorCode - 1]
}