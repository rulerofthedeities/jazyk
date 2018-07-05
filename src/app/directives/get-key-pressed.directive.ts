import {Directive, HostListener, Input, Output, EventEmitter} from '@angular/core';

@Directive({selector: '[kmPressed]'})

export class GetKeyPressDirective {
  @Input() keyPressed: string;
  @Output() hasKeyPressed = new EventEmitter<string>();
  @HostListener('document:keydown', ['$event'])

  keypress(e: KeyboardEvent) {
    this.hasKeyPressed.emit(e.key.toString());
  }
}
