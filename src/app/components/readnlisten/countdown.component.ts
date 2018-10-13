import { Component, Input, Output, OnInit, OnDestroy, ElementRef, ViewChild, EventEmitter } from '@angular/core';
import { timer } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-countdown',
  templateUrl: 'countdown.component.html',
  styleUrls: ['countdown.component.css']
})

export class CountdownComponent implements OnInit, OnDestroy {
  @Input() counter = 3;
  @Input() private mute = false;
  @Input() textColor = 'black';
  @Output() countedDown = new EventEmitter();
  @ViewChild('countdown') countdown: ElementRef;
  private componentActive = true;
  private circleM;
  private circleL;
  private circleA;
  boxWidth = 400;
  boxHeight = 400;
  radius = 180;
  pathColor = '#bbb';
  backgroundColor = '#ddd';
  angle: number;
  radian: number;
  cx: number;
  cy: number;
  x0: number;
  y0: number;
  rx: number;
  ry: number;
  d: string;
  beep1: any;
  beep2: any;

  ngOnInit() {
    this.initialize();
    this.startCountDown();
  }

  onResize(event) {
    if (this.countdown.nativeElement.clientWidth !== this.boxWidth) {
      // size changed
      this.calculateWidth();
      this.calculatePath();
    }
  }

  private initialize() {
    // Audio
    if (!this.mute) {
      this.beep1 = this.loadAudio('/assets/audio/countdown.ogg');
      this.beep2 = this.loadAudio('/assets/audio/bleep.ogg');
    }
    // Drawing
    this.angle = 0;
    this.radian = this.angleToRad(this.angle);
    this.boxHeight = this.countdown.nativeElement.clientHeight || this.boxHeight;
    this.cy = this.boxHeight / 2;
    this.y0 = this.cy - this.radius;
    this.rx = this.ry = this.radius;
    this.calculateWidth();
    this.calculatePath();
  }

  private calculateWidth() {
    this.boxWidth = this.countdown.nativeElement.clientWidth;
    this.cx = this.boxWidth / 2;
    this.x0 = this.cx;
  }

  private calculatePath() {
    this.circleM = this.createPathData('M', this.cx, this.cy);
    this.circleL = this.createPathData('L', this.x0, this.y0);
    this.circleA = this.createPathData('A', this.rx, this.ry);
    this.calculateAngle(this.radius, this.radian);
  }

  private calculateAngle(radius: number, radian: number) {
    const x = this.cx + radius * Math.sin(radian),
          y = this.cy - radius * Math.cos(radian),
          circleEnd = this.createPathData(null, x, y),
          arcSweep = this.setArcSet(this.angle);
    this.d = this.circleM + this.circleL + this.circleA + '0 ' + arcSweep + circleEnd + 'Z';
  }

  private createPathData(prefix: string, arg1: number, arg2: number) {
    let path = arg1 + ',' + arg2 + ' ';
    if (prefix) {
      path = prefix + path;
    }
    return path;
  }

  private setArcSet(angle): string {
    if (Math.round(angle) <= 180) {
      return this.createPathData(null, 0, 1);
    } else {
      return this.createPathData(null, 1, 1);
    }
  }

  private updateAngle(t: number, steps: number) {
    this.angle = (t % steps) * (360 / steps) ;
    this.radian = this.angleToRad(this.angle);
    this.calculateAngle(this.radius, this.radian);
  }

  private angleToRad(angle: number) {
    return (angle * Math.PI) / 180;
  }

  private startCountDown() {
    const intervalMs = 50,
          steps = 1000 / intervalMs,
          timerObservable = timer(0, intervalMs);
    this.playSound(false);
    timerObservable
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(t => {
      this.updateAngle(t, steps);
      if (t > 0 && t % steps === 0) {
        this.counter--;
        if (this.counter === 0) {
          this.playSound(true);
          this.updateAngle(0, 1);
          this.countedDown.next();
          this.componentActive = false;
        } else {
          this.playSound(false);
        }
      }
    });
  }

  private loadAudio(file: string): any {
    const audio = new Audio();
    audio.src = file;
    audio.load();
    audio.volume = 0.1;
    return audio;
  }

  private playSound(last: boolean) {
    if (!this.mute) {
      if (last) {
        this.beep2.play();
      } else {
        this.beep1.play();
      }
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
