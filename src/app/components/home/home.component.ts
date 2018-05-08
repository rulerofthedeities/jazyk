import {Component, OnInit, OnDestroy} from '@angular/core';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {AuthService} from '../../services/auth.service';
import {takeWhile} from 'rxjs/operators';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.css']
})

export class HomeComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};

  constructor(
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.getTranslations(this.userService.user.main.lan);
    this.userService.languageChanged.subscribe(
      newLan => this.getTranslations(newLan)
    );
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  private getTranslations(lan) {
    this.utilsService
    .fetchTranslations(lan, 'HomeComponent')
    .pipe(takeWhile(() => this.componentActive))
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
