import { Component, Input } from '@angular/core';

@Component({
  selector: 'km-region-flag',
  template: `
    <img
      src="/assets/img/flags/{{lan}}.png"
      class="flag"
      [class.thumb]="thumb" *ngIf="lan">
  `,
  styles: [`
    .thumb {
      width: 20px;
      height: 13px;
    }
  `]
})

export class RegionFlagComponent {
  @Input() lan: string; // default lan for flag
  @Input() thumb = false;
}
