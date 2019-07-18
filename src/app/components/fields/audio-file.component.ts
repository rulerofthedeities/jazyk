import { Component, OnInit, OnChanges, OnDestroy, Input, EventEmitter, Output } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-audio-file',
  templateUrl: 'audio-file.component.html',
  styleUrls: ['./files.css']
})

export class AudioFileComponent implements OnInit, OnChanges, OnDestroy {
  @Input() fileUrl: string;
  @Input() size = '24';
  @Input() autoPlay = false;
  @Input() active = true;
  @Output() ended = new EventEmitter<boolean>();
  private componentActive = true;
  private supportsOgg: string;
  audio: any;

  constructor(
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.observe();
  }

  ngOnChanges() {
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

  private checkAudioTypeSupport(type) {
    const formats = {
      mp3: 'audio/mpeg',
      mp4: 'audio/mp4',
      ogg: 'audio/ogg; codecs=vorbis',
      aif: 'audio/x-aiff'
    };
    this.supportsOgg = this.audio.canPlayType(formats[type] || type);
  }

  private play() {
    if (this.active) {
      if (!this.audio) {
        this.audio = new Audio();
        this.audio.src = this.getSource(this.fileUrl);
        console.log('source', this.audio.src);
        this.audio.load();
      } else {
        if (this.audio.ended || this.audio.paused) {
          this.audio.play();
        } else {
          this.audio.pause();
        }
      }
      this.audio.addEventListener('ended', e => {
        // The audio has ended
        this.ended.emit(true);
      });
      this.audio.addEventListener('loadeddata', e => {
        // The audio has loaded
        if (this.audio) {
          const promise = this.audio.play();
          if (promise !== undefined) {
            promise.then(_ => {
              // Autoplay started!
            }).catch(error => {});
          }
        }
      });
    }
  }

  private getSource(fileName: string): string {
    if (this.supportsOgg === undefined) {
      this.checkAudioTypeSupport('ogg');
    }
    console.log('iOs', this.isIOS());
    if (this.supportsOgg === 'probably' && !this.isIOS()) {
      return fileName;
    } else {
      const pos = fileName.lastIndexOf('/');
      if (pos > 0) {
        const file = 'mp3_' + fileName.slice(pos + 1, fileName.length);
        return fileName.slice(0, pos + 1) + file;
      } else {
        return fileName;
      }
    }
  }

  private isIOS(): boolean {
    // canPlayType on iOS not reliable
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  private observe() {
    this.sharedService
    .audioEvent
    .pipe(takeWhile( () => this.componentActive))
    .subscribe(
      event => {
        switch (event) {
          case 'stop':
            if (this.audio) {
              this.audio.pause();
              this.audio = null;
            }
          break;
          case 'pause':
            if (this.audio) {
              if (this.audio.paused) {
                this.audio.play();
              } else {
                this.audio.pause();
              }
            }
          break;
        }
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
