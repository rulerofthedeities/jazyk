import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {Message, CompactProfile} from '../../models/user.model';
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
  parentMessage: Message;
  showReply = false;
  showNewMessage = false;
  tab = 'inbox';
  infoMsg = '';
  recipients: CompactProfile[] = [];
  selectedRecipient: CompactProfile;

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
    this.parentMessage = null;
    this.infoMsg = '';
    this.showReply = false;
    this.currentMessage = this.messages[i];
    if (!this.currentMessage.recipient.read && this.isRecipient(this.currentMessage)) {
      this.setMessageAsRead(i);
      this.userService.updateUnreadMessagesCount(false);
    }
    if (this.currentMessage.parentId) {
      this.fetchParentMessage(this.currentMessage.parentId);
    }
  }

  onCreateReply(replyField: any) {
    this.infoMsg = '';
    replyField.clearField();
    this.showReply = true;
  }

  onCreateMessage() {
    this.infoMsg = '';
    this.showNewMessage = true;
    this.getPossibleRecipients();
  }

  onSendReply(message: Message, content: string) {
    this.infoMsg = '';
    console.log('sending reply', content);
    this.sendReplyMessage(message, content);
  }

  onSendMessage(content: string) {
    this.infoMsg = '';
    console.log('sending message', content);
    if (this.selectedRecipient) {
      this.sendNewMessage(content);
    }
  }

  onDeleteMessage(message: Message) {
    const tpe = this.isRecipient(message) ? 'recipient' : 'sender';
    const action = this.tab === 'sent' || this.tab === 'trash'  ? 'deleted' : 'trash';
    this.messages = this.messages.filter(msg => msg._id !== message._id);
    this.deleteMessage(message._id, tpe, action);
    this.closeMessage(); // In case it was deleted from inside the message
  }

  onRecipientSelected(user: CompactProfile, msgField: any) {
    this.selectedRecipient = user;
    msgField.clearField();
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
    this.infoMsg = '';
    this.currentMessage = null;
    this.showNewMessage = false;
  }

  private sendReplyMessage(message: Message, content: string) {
    this.showReply = false;
    const replyMessage: Message = {
      recipient: {
        id: message.sender.id,
        userName: message.sender.userName,
        emailHash: message.sender.emailHash
      },
      sender: {
        id: this.userService.user._id,
        userName: this.userService.user.userName,
        emailHash: this.userService.user.emailHash
      },
      message: content
    };
    this.saveMessage(replyMessage, true);
    console.log('sending reply', message.message, 'to', message.sender.userName);
  }

  private sendNewMessage(content: string) {
    this.showNewMessage = false;
    const newMessage: Message = {
      recipient: {
        id: this.selectedRecipient._id,
        userName: this.selectedRecipient.userName,
        emailHash: this.selectedRecipient.emailHash
      },
      sender: {
        id: this.userService.user._id,
        userName: this.userService.user.userName,
        emailHash: this.userService.user.emailHash
      },
      message: content
    };
    this.saveMessage(newMessage, false);
  }

  private saveMessage(message: Message, isReply: boolean) {
    if (isReply) {
      message.parentId = message._id;
    }
    this.userService
    .saveMessage(message)
    .takeWhile(() => this.componentActive)
    .subscribe(
      saved => {
        this.showReply = false;
        this.closeMessage();
        if (isReply) {
          const info = this.text['ReplySent'];
          this.infoMsg = info.replace('%s', message.recipient.userName);
        } else {
          const info = this.text['MessageSent'];
          this.infoMsg = info.replace('%s', message.recipient.userName);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private setMessageAsRead(i: number) {
    this.userService
    .setMessageAsRead(this.messages[i]._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      read => this.messages[i].recipient.read = true,
      error => this.errorService.handleError(error)
    );
  }

  private deleteMessage(messageId: string, tpe: string, action: string) {
    this.userService
    .deleteMessage(messageId, tpe, action)
    .takeWhile(() => this.componentActive)
    .subscribe(
      deleted => {
        this.infoMsg = this.text['MessageDeleted'];
      },
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

  private fetchParentMessage(messageId: string) {
    this.userService
    .fetchMessage(messageId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      message => this.parentMessage = message,
      error => this.errorService.handleError(error)
    );
  }

  private getPossibleRecipients() {
    this.userService
    .fetchRecipients()
    .takeWhile(() => this.componentActive)
    .subscribe(
      recipients => {
        this.recipients = recipients;
        if (recipients.length > 0) {
          this.selectedRecipient = recipients[0];
        }
      },
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
