import {Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'km-toggle',
  templateUrl: 'toggle.component.html',
  styleUrls: ['toggle.component.css']
})

export class ToggleComponent {
  @Input() toggle: boolean;
  @Output() toggled = new EventEmitter<boolean>();

  onSetFlag(flag: boolean) {
    this.toggled.emit(flag);
  }
}
