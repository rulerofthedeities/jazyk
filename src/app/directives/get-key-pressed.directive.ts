import {Directive, HostListener, Input, Output, EventEmitter} from '@angular/core';

@Directive({selector: '[kmPressed]'})

export class GetKeyPressDirective {
  @Input() keyPressed: string;
  @Output() onKeyPressed = new EventEmitter();
  @HostListener('document:keydown', ['$event'])

  keypress(e: KeyboardEvent) {
    if (e.key.toString() === this.keyPressed) {
      this.onKeyPressed.emit(true);
    }
  }
}
