import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'km-loader',
  templateUrl: 'loader.component.html',
  styleUrls: ['loader.component.css']
})

export class LoaderComponent implements OnInit {
  show = false;
  @Input() msg = '';
  @Input() showBackground = true;

  ngOnInit() {
    this.delay();
  }

  private delay() {
    // only show the loader after 200ms
    setTimeout(() => {
      this.show = true;
    }, 200);
  }
}
