import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { PlatformService } from '../../services/platform.service';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'km-loader',
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
    private platform: PlatformService
  ) {}

  ngOnInit() {
    this.delay();
  }

  private delay() {
    // only show the loader after 200ms
    if (this.platform.isBrowser) {
      const timerObservable = timer(200, 0);
      this.subscription = timerObservable.subscribe(t => this.show = true);
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
