export class AudioService {

  loadAudio(file: string): any {
    const audio = new Audio();
    audio.src = file;
    audio.load();
    audio.volume = 0.1;
    return audio;
  }

  playSound(mute: boolean, sound: any) {
    if (!mute) {
      sound.play();
    }
  }
}
