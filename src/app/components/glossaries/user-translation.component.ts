import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'km-user-translation',
  templateUrl: 'user-translation.component.html',
  styleUrls: ['user-translation.component.css']
})

export class UserWordTranslationComponent implements OnInit {
  @Input() text: Object;
  @Input() private translations: string;
  @Output() newTranslation = new EventEmitter<string>();
  @Output() cancelTranslation = new EventEmitter();
  isAnswered = false;
  updatedTranslations: string;

  ngOnInit() {
    this.updatedTranslations =  this.translations.replace(new RegExp(/\|/g), '\n');
  }

  onSubmitTranslation() {
    this.newTranslation.emit(this.updatedTranslations);
  }

  onCancelTranslation() {
    this.cancelTranslation.emit();
  }
}
