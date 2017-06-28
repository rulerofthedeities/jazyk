import {Component, OnInit, Input} from '@angular/core';
import {File} from '../../models/exercise.model';

@Component({
  selector: 'km-audio-file',
  template: `
    <span 
      (click)="onPlay()"
      class="audio fa fa-play-circle"
      [ngClass]="{
        'fa-play-circle': !audio || audio.ended ? true : false,
        'fa-pause-circle': audio && !audio.ended ? true : false,
        inactive: !active
      }">
    </span>
  `,
  styleUrls: ['./files.css']
})

export class AudioFileComponent implements OnInit {
  @Input() fileName: string;
  @Input() autoPlay = false;
  @Input() active = true;
  audio: any;

  ngOnInit() {
    if (this.autoPlay) {
      this.play();
    }
  }

  onPlay() {
    event.stopPropagation();
    this.play();
  }

  private play() {
    if (this.active) {
      if (!this.audio) {
        this.audio = new Audio();
        this.audio.src = this.fileName;
        this.audio.load();
      } else {
        if (this.audio.ended || this.audio.paused) {
          this.audio.play();
        } else {
          this.audio.pause();
        }
      }
      this.audio.onended = () => {
        console.log('The audio has ended');
      };
      this.audio.onloadeddata = () => {
        console.log('The audio has loaded');
        this.audio.play();
      };
      this.audio.onplaying = () => {
        console.log('The audio is now playing');
      };
    }
  }
}