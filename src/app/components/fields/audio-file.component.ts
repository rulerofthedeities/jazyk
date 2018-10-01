import { Component, OnChanges, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'km-audio-file',
  templateUrl: 'audio-file.component.html',
  styleUrls: ['./files.css']
})

export class AudioFileComponent implements OnChanges {
  @Input() fileUrl: string;
  @Input() size = '24';
  @Input() autoPlay = false;
  @Input() active = true;
  @Output() ended = new EventEmitter<boolean>();
  audio: any;

  ngOnChanges() {
    console.log('audio changed', this.fileUrl);
    if (this.audio && this.fileUrl !== this.audio.src) {
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
        this.audio.src = this.fileUrl;
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
        this.ended.emit(true);
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
