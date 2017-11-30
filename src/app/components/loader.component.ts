import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'km-loader',
  template: `
  <div class="panel panel-default" [ngStyle]="{visibility : show ? 'visible' : 'hidden'}">
    <div class="panel-body">
      <div class="loader">
        <div class="spinner">
          <div class="bounce0"></div>
          <div class="bounce1"></div>
          <div class="bounce2"></div>
          <div class="bounce3"></div>
          <div class="bounce4"></div>
        </div>
        <div class="msg">
          {{msg}}
        </div>
      </div>
    </div>
  </div>
  `,
  styleUrls: ['loader.component.css']
})

export class LoaderComponent implements OnInit {
  show = false;
  @Input() msg = '';

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
