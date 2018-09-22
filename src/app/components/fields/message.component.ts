import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'km-message',
  templateUrl: 'message.component.html',
  styles: [`
    textarea {
      width: 100%;
      height: 78px;
      overflow: hidden;
    }
  `]
})

export class MailFieldComponent {
  @Input() sendTxt: string;
  @Output() send = new EventEmitter<string>();
  @ViewChild('msg') msg: ElementRef;
  minLength = 5;
  maxLength = 140;
  message: string;

  onSendMessage(msg: string) {
    const message = msg.trim();
    if (message.length >= this.minLength) {
      this.send.emit(message);
    }
  }

  clearField() {
    this.msg.nativeElement.value = '';
  }
}
