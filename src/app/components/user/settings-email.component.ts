import { Component, Input, OnDestroy } from '@angular/core';
import { UserService } from '../../services/user.service';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-user-settings-email',
  templateUrl: 'settings-email.component.html'
})

export class UserSettingsEmailComponent implements OnDestroy {
  private componentActive = true;
  @Input() text: Object;

  constructor(
    private userService: UserService
  ) {}

  onSendTestMail() {
    console.log('sending mail verification component');
    this.userService.sendMailVerification()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      result => {
        console.log('mail verification sent', result);
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
