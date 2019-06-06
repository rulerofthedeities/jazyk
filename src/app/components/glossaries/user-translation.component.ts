import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'km-user-translation',
  templateUrl: 'user-translation.component.html',
  styleUrls: ['user-translation.component.css']
})

export class UserWordTranslationComponent {
  @Input() translation: string;
  @Output() newTranslation = new EventEmitter<string>();
  @Output() cancelTranslation = new EventEmitter();
  isAnswered = false;

  onSubmitTranslation() {
    console.log('new translation', this.translation);
    this.newTranslation.emit(this.translation);
  }

  onCancelTranslation() {
    this.cancelTranslation.emit();
  }
}
