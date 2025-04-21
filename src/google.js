import {existsSync} from 'fs';
import {join, resolve} from 'path';
import {TextToSpeechClient} from '@google-cloud/text-to-speech';

let ttsClient;
const getTTSClient = () => {
    if(!ttsClient){
        const keyFilePath = join(resolve(), 'data/key.json');
        if(existsSync(keyFilePath)){
            process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilePath;
            ttsClient = new TextToSpeechClient();
        }
    }
    return ttsClient;
}
export const googleTTS = (res, text) => {
    if(!res){
        return;
    }

    const client = getTTSClient();
    if(!text || !client){
        return res.sendStatus(500);
    }
    const request = {
        input: {text},
        voice: {
            languageCode: 'ko-KR',
            ssmlGender: 'NEUTRAL',
        },
        audioConfig: {audioEncoding: 'MP3'},
    };

    client.synthesizeSpeech(request).then(([response]) => {
        // 응답 헤더 설정: audio/mp3로 스트리밍 전송
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': response.audioContent.length
        });
        res.send(response.audioContent);
    }).catch(error => {
        console.error(error);
        res.sendStatus(500);
    });
}