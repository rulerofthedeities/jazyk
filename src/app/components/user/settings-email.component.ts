import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../services/user.service';
import { takeWhile } from 'rxjs/operators';
import { MailData } from '../../models/user.model';

@Component({
  selector: 'km-user-settings-email',
  templateUrl: 'settings-email.component.html',
  styleUrls: ['settings-email.component.css']
})

export class UserSettingsEmailComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  private componentActive = true;
  infoMsg: string;
  errorMsg: string;
  isMailVerified = false;
  isVerificationSent = false;

  constructor(
    private userService: UserService
  ) {}

  ngOnInit() {
    const mailVerification = this.userService.user.mailVerification;
    if (!!mailVerification && mailVerification.isVerified) {
      this.isMailVerified = true;
    }
  }

  onSendVerificationMail() {
    const mailData: MailData = this.userService.getMailData(this.text, 'verification', this.userService.user.userName, false);
    this.userService
    .sendMailVerification(mailData)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      result => {
        if (result) {
          this.isVerificationSent = true;
          this.infoMsg = this.text['VerificationMailSent'] + ' ' + this.text['ClickOnVerificationLink'];
          this.errorMsg = '';
        } else {
          this.errorMsg = this.text['ErrorSendingMail'] + ' ' + this.text['TryAgainLater'];
          this.infoMsg = '';
        }
      },
      error => {
        this.errorMsg = this.text['ErrorSendingMail'] + ' ' + this.text['TryAgainLater'];
        this.infoMsg = '';
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
