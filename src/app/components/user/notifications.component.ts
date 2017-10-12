import {Component, OnInit, OnDestroy} from '@angular/core';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import 'rxjs/add/operator/takeWhile';

@Component({
  templateUrl: 'notifications.component.html',
  styleUrls: ['user.css']
})

export class UserNotificationsComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};

  constructor(
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getTranslations();
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(this.userService.user.lan, 'UserComponent')
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
