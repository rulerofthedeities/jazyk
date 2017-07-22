import {Directive, HostListener, Input, Output, EventEmitter} from '@angular/core';

@Directive({selector: '[kmPressed]'})

export class GetKeyPressDirective {
  @Input() keyPressed: string;
  @Output() onKeyPressed = new EventEmitter<string>();
  @HostListener('document:keydown', ['$event'])

  keypress(e: KeyboardEvent) {
    this.onKeyPressed.emit(e.key.toString());
  }
}
