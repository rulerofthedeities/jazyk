import { Component, OnInit, OnDestroy } from '@angular/core';
import { UtilsService } from '../../services/utils.service';
import { SharedService } from '../../services/shared.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { takeWhile } from 'rxjs/operators';
import { LicenseUrl } from '../../models/course.model';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.css']
})

export class HomeComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};
  licenses: LicenseUrl[];

  constructor(
    private utilsService: UtilsService,
    private sharedService: SharedService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.setTitle(this.authService.isLoggedIn());
    this.getDependables(this.userService.user.main.lan);
    this.userService.interfaceLanguageChanged.subscribe(
      newLan => this.getDependables(newLan)
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

  private getDependables(lan) {
    const options = {
      lan,
      component: 'HomeComponent',
      getTranslations: true,
      getLicenses: true
    };
    this.utilsService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.licenses = dependables.licenseUrls;
        this.text = this.utilsService.getTranslatedText(dependables.translations);
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
