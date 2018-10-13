import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs/rx';

@Component({
  selector: 'km-loader',
  templateUrl: 'loader.component.html',
  styleUrls: ['loader.component.css']
})

export class LoaderComponent implements OnInit, OnDestroy {
  @Input() msg = '';
  @Input() showBackground = true;
  private subscription: Subscription;
  show = false;

  ngOnInit() {
    this.delay();
  }

  private delay() {
    // only show the loader after 200ms
    const timer = Observable.timer(200, 0);
    this.subscription = timer.subscribe(t => this.show = true);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
