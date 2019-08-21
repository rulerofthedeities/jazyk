import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { PlatformService } from '../../services/platform.service';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'km-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'loader.component.html',
  styleUrls: ['loader.component.css']
})

export class LoaderComponent implements OnInit, OnDestroy {
  @Input() msg = '';
  @Input() showBackground = true;
  @Input() inline = false;
  @Input() small = false;
  @Input() margin = '60px'; // Vertical
  @Input() spinnerMargin = 'auto'; // Horizontal
  private subscription: Subscription;
  show = false;

  constructor(
    private platform: PlatformService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.delay();
  }

  private delay() {
    // only show the loader after 200ms
    if (this.platform.isBrowser) {
      const timerObservable = timer(200, 0);
      this.subscription = timerObservable.subscribe(t => {
        this.subscription.unsubscribe();
        this.show = true;
        this.cdr.detectChanges();
      });
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
