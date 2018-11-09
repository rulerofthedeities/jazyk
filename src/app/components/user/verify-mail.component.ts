import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeWhile } from 'rxjs/operators';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';

@Component({
  templateUrl: 'verify-mail.component.html'
})

export class VerifyMailComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object;
  errorMsg: string;
  infoMsg: string;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.getTranslations(this.userService.user.main.lan);
  }

  private checkVerificationId(verId: string) {
    this.userService
    .checkVerificationId(verId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      verified => {
        if (verified) {
          this.infoMsg = this.text['EmailConfirmed'];
          this.errorMsg = '';
        } else {
          this.errorMsg = this.text['ErrorMailVerificationId'];
        }
      },
      error => {
        this.errorMsg = this.text['ErrorNotVerified'] + ' - ' + error;
      }
    );
  }

  private getTranslations(lan: string) {
    this.sharedService
    .fetchTranslations(lan, 'UserComponent')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.sharedService.getTranslatedText(translations);
          this.sharedService.setPageTitle(this.text, 'EmailVerification');
          this.getQueryParams();
        }
      }
    );
  }

  private getQueryParams() {
    this.route.queryParams
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      params => {
        if (params['verId']) {
          console.log(params['verId']);
          this.checkVerificationId(params['verId']);
        } else {
          this.errorMsg = 'Error: No verification Id found';
        }
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
