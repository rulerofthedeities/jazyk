import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'km-loader',
  templateUrl: 'loader.component.html',
  styleUrls: ['loader.component.css']
})

export class LoaderComponent implements OnInit, OnDestroy {
  @Input() msg = '';
  @Input() showBackground = true;
  @Input() margin = '60px';
  private subscription: Subscription;
  show = false;

  ngOnInit() {
    this.delay();
  }

  private delay() {
    // only show the loader after 200ms
    const timerObservable = timer(200, 0);
    this.subscription = timerObservable.subscribe(t => this.show = true);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
