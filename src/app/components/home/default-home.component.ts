import {Component, Input} from '@angular/core';

@Component({
  selector: 'km-home-default',
  templateUrl: 'default-home.component.html',
  styleUrls: ['default-home.component.css']
})

export class DefaultHomeComponent {
  private componentActive = true;
  @Input() text: Object;
}
