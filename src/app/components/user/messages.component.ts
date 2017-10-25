import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {Message} from '../../models/user.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  templateUrl: 'messages.component.html',
  styleUrls: ['user.css', 'messages.component.css']
})

export class UserMessagesComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};
  messages: Message[];
  currentMessage: Message;
  tab = 'inbox';
  infoMsg = '';

  constructor(
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getTranslations();
    this.fetchMessages();
  }

  onSelectTab(newTab: string) {
    this.infoMsg = '';
    this.tab = newTab;
    this.fetchMessages();
  }

  onSelectMessage(i: number) {
    this.infoMsg = '';
    this.currentMessage = this.messages[i];
    if (!this.currentMessage.read && this.isRecipient(this.currentMessage)) {
      this.setMessageAsRead(i);
      //this.userService.updateUnreadMessagesCount(false);
    }
  }

  onCloseMessage() {
    this.closeMessage();
  }

  onKeyPressed(key: string) {
    if (key === 'Escape') {
      this.closeMessage();
    }
  }

  isRecipient(message: Message): boolean {
    let isRecipient = false;
    if (this.userService.user._id === message.recipient.id) {
      isRecipient = true;
    }
    return isRecipient;
  }

  private closeMessage() {
    this.currentMessage = null;
  }

  private setMessageAsRead(i: number) {
    this.userService
    .setMessageAsRead(this.messages[i]._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      read => this.messages[i].read = true,
      error => this.errorService.handleError(error)
    );
  }

  private fetchMessages() {
    this.userService
    .fetchMessages(this.tab)
    .takeWhile(() => this.componentActive)
    .subscribe(
      messages => this.messages = messages,
      error => this.errorService.handleError(error)
    );
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(this.userService.user.main.lan, 'UserComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.utilsService.getTranslatedText(translations);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
