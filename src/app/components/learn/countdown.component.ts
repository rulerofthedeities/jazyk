import {Component, Input, Output, OnInit, OnDestroy, ElementRef, ViewChild, HostListener, EventEmitter} from '@angular/core';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-countdown',
  templateUrl: 'countdown.component.html',
  styles: [`
    :host {
      display:block;
      background-color: #41474b;
      background: linear-gradient(0deg, #2c3033, #41474b, #2c3033);
    }
    .countdown {
      width: 100%;
      height: 400px;
    }
  `]
})

export class LearnCountdownComponent implements OnInit, OnDestroy {
  @Input() counter = 3;
  @Input() textColor = 'black';
  @Output() countedDown = new EventEmitter();
  @ViewChild('countdown') countdown: ElementRef;
  private componentActive = true;
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


  x;
  y;

  arcSweep;
  circleM;
  circleL;
  circleA;
  circleEnd;

  ngOnInit() {
    this.Initialize();
    this.animate();
  }

  onResize(event) {
    if (this.countdown.nativeElement.clientWidth !== this.boxWidth) {
      // size changed
      this.calculateWidth();
      this.calculatePath();
    }
  }

  private Initialize() {
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
    this.calculateAngle(this.radius, this.radian);
    this.setArcSet(this.angle);
    this.circleM = this.createPathData('M', this.cx, this.cy);
    this.circleL = this.createPathData('L', this.x0, this.y0);
    this.circleA = this.createPathData('A', this.rx, this.ry);
  }

  private calculateAngle(radius: number, radian: number) {
    this.x = this.cx + radius * Math.sin(radian);
    this.y = this.cy - radius * Math.cos(radian);
    this.circleEnd = this.createPathData(null, this.x, this.y);
  }

  private setArcSet(angle) {
    if (Math.round(angle) <= 180) {
      this.arcSweep = this.createPathData(null, 0, 1);
    } else if (Math.round(angle) > 180) {
      this.arcSweep = this.createPathData(null, 1, 1);
    }
  }

  private createPathData(prefix: string, arg1: number, arg2: number) {
    let path = arg1 + ',' + arg2 + ' ';
    if (prefix) {
      path = prefix + path;
    }
    return path;
  }

  private animate() {
    const startDate = new Date();
    const intervalMs = 50;
    const steps = 1000 / intervalMs;
    const timer = TimerObservable.create(0, intervalMs);
    timer
    .takeWhile(() => this.componentActive)
    .subscribe(t => {
      this.updateAngle(t, steps);
      if (t > 0 && t % steps === 0) {
        this.counter--;
        if (this.counter === 0) {
          this.updateAngle(0, 1);
          this.countedDown.next();
          this.componentActive = false;
        }
      }
    });
  }

  private updateAngle(t: number, steps: number) {
    this.angle = (t % steps) * (360 / steps) ;
    this.radian = this.angleToRad(this.angle);
    this.setArcSet(this.angle);
    this.calculateAngle(this.radius, this.radian);
  }

  private angleToRad(angle: number) {
    return (angle * Math.PI) / 180;
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
