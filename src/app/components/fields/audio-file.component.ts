import {Component, OnChanges, Input} from '@angular/core';
import {File} from '../../models/word.model';
import {RegionAudio} from '../../models/exercise.model';

@Component({
  selector: 'km-audio-file',
  templateUrl: 'audio-file.component.html',
  styleUrls: ['./files.css']
})

export class AudioFileComponent implements OnChanges {
  @Input() regionAudio: RegionAudio;
  @Input() autoPlay = false;
  @Input() active = true;
  audio: any;

  ngOnChanges() {
    if (this.audio && this.regionAudio.s3 !== this.audio.src) {
      this.audio = null;
    }
    if (this.autoPlay) {
      this.play();
    }
  }

  onPlay(event: MouseEvent) {
    event.stopPropagation();
    this.play();
  }

  private play() {
    if (this.active) {
      if (!this.audio) {
        this.audio = new Audio();
        this.audio.src = this.regionAudio.s3;
        this.audio.load();
      } else {
        if (this.audio.ended || this.audio.paused) {
          this.audio.play();
        } else {
          this.audio.pause();
        }
      }
      this.audio.onended = () => {
        // The audio has ended
      };
      this.audio.onloadeddata = () => {
        // The audio has loaded
        if (this.audio) {
          this.audio.play();
        }
      };
      this.audio.onplaying = () => {
        // The audio is now playing
      };
    }
  }
}
