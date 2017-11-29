import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'km-loader',
  template: `
  <div class="panel panel-default" *ngIf="show">
    <div class="panel-body">
      <div class="spinner">
        <div class="bounce0"></div>
        <div class="bounce1"></div>
        <div class="bounce2"></div>
        <div class="bounce3"></div>
        <div class="bounce4"></div>
      </div>
    </div>
  </div>
  `,
  styleUrls: ['loader.component.css']
})

export class LoaderComponent implements OnInit {
  show = false;

  ngOnInit() {
    this.delay();
  }

  private delay() {
    // only show the loader after 800ms
    setTimeout(() => {
      this.show = true;
    }, 800);
  }
}
