import { Component, OnInit, OnChanges, OnDestroy, Input, EventEmitter, Output,
         ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-audio-file',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    private cdr: ChangeDetectorRef,
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
        const src = this.getSource(this.fileUrl);
        this.audio.src = src;
        this.audio.load();
      } else {
        if (this.audio.ended || this.audio.paused) {
          this.audio.play();
        } else {
          this.audio.pause();
        }
      }
      this.sharedService.detectChanges(this.cdr);
      this.audio.addEventListener('ended', e => {
        // The audio has ended
        this.audio = null;
        this.ended.emit(true);
        this.sharedService.detectChanges(this.cdr);
      });
      this.audio.addEventListener('loadeddata', e => {
        // The audio has loaded
        if (this.audio) {
          const promise = this.audio.play();
          if (promise !== undefined) {
            promise.then(_ => {
              // Autoplay started!
              this.sharedService.detectChanges(this.cdr);
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
    if (this.supportsOgg === 'probably') {
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
              this.sharedService.detectChanges(this.cdr);
            }
          break;
          case 'pause':
            if (this.audio) {
              if (this.audio.paused) {
                this.audio.play();
              } else {
                this.audio.pause();
              }
              this.sharedService.detectChanges(this.cdr);
            }
          break;
        }
      }
    );
  }

  ngOnDestroy() {
    this.audio = null;
    this.componentActive = false;
    this.cdr.detach();
  }
}
