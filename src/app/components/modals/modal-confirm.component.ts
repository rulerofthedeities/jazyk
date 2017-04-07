import {Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'km-modal-confirm',
  templateUrl: 'modal-confirm.component.html'
})

export class ModalConfirmComponent {
  @Input() level = 'danger';
  @Output() confirmed = new EventEmitter<boolean>();
  showModal = false;

  onModalYes() {
    this.showModal = false;
    this.confirmed.emit(true);
  }

  onModalNo() {
    this.showModal = false;
    this.confirmed.emit(false);
  }
}
