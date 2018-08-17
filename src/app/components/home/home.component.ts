import {Component, OnInit, OnDestroy} from '@angular/core';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {SharedService} from '../../services/shared.service';
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
    private sharedService: SharedService,
    private userService: UserService,
    private errorService: ErrorService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.setTitle(this.authService.isLoggedIn());
    this.getTranslations(this.userService.user.main.lan);
    this.userService.interfaceLanguageChanged.subscribe(
      newLan => this.getTranslations(newLan)
    );
    this.sharedService.justLoggedInOut.subscribe(
      loggedIn => this.setTitle(loggedIn)
    );
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  private setTitle(isLoggedIn: boolean) {
    if (isLoggedIn) {
      this.utilsService.setPageTitle(null, 'Dashboard');
    } else {
      this.utilsService.setPageTitle(null, '');
    }
  }

  private getTranslations(lan) {
    this.utilsService
    .fetchTranslations(lan, 'HomeComponent')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => this.text = this.utilsService.getTranslatedText(translations),
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
