window.addEventListener("load", () => {
    // TTS 활성화 전환 버튼
    const updateButton = () => {
        if(localStorage.getItem('enableTTS') === '0'){ // TTS 비활성화
            document.querySelector('.bi.bi-megaphone').style.display = ''
            document.querySelector('.bi.bi-megaphone-fill').style.display = 'none'
        }else{ // TTS 활성화
            document.querySelector('.bi.bi-megaphone').style.display = 'none'
            document.querySelector('.bi.bi-megaphone-fill').style.display = ''
        }
    }

    updateButton()
    const ttsButton = document.getElementById('tts-button');
    ttsButton.onclick = () => {
        const enabled = localStorage.getItem('enableTTS') || '1'
        localStorage.setItem('enableTTS', (+enabled + 1) % 2 + '')
        showToast(enabled === '1' ? 'TTS 기능이 비활성화 되었습니다.' : 'TTS 기능이 활성화 되었습니다')
        updateButton()
    }

    // 설정 모달 버튼
    const modal = document.getElementById('settings-modal');
    const settingsButton = document.getElementById('settings-button');
    settingsButton.onclick = () => {
        modal.classList.add('show');
    };
    modal.onclick = (e) => {
        if(e.target === modal){
            modal.classList.remove('show');
        }
    }
})