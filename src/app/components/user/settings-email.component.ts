import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { takeWhile } from 'rxjs/operators';
import { MailData, MailOptIn } from '../../models/user.model';

@Component({
  selector: 'km-user-settings-email',
  templateUrl: 'settings-email.component.html',
  styleUrls: ['settings-email.component.css']
})

export class UserSettingsEmailComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  private componentActive = true;
  mailForm: FormGroup;
  infoMsg: string;
  errorMsg: string;
  isMailVerified = false;
  isVerificationSent = false;
  isReady = false;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService
  ) {}

  ngOnInit() {
    const mailVerification = this.userService.user.mailVerification;
    if (!!mailVerification && mailVerification.isVerified) {
      this.isMailVerified = true;
    }
    this.buildForm();
  }

  onSendVerificationMail() {
    const mailData: MailData = this.userService.getMailData(
      this.text,
      'verification',
      {
        userName: this.userService.user.userName,
        isNewUser: false
      }
    );
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

  onSetFlag(field: string, status: boolean) {
    this.setFlag(field, status);
  }

  private setFlag(field: string, status: any) {
    this.mailForm.patchValue({[field]: status});
    this.mailForm.markAsDirty();
    this.infoMsg = '';
    this.updateSettings(this.mailForm.value);
  }

  private updateSettings(settings: MailOptIn) {
    this.userService
    .saveMailSettings(settings)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      result => {
        this.userService.user.mailOptIn = settings;
      }
    );
  }

  private buildForm() {
    const user = this.userService.user;
    if (!user.mailOptIn) {
      user.mailOptIn = {info: false};
    }
    this.mailForm = this.formBuilder.group({
      info: [user.mailOptIn.info]
    });
    this.isReady = true;
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
