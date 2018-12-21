import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { SharedService } from '../../services/shared.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { LicenseUrl } from '../../models/main.model';
import { takeWhile } from 'rxjs/operators';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.css']
})

export class HomeComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};
  licenses: LicenseUrl[];
  intLan = 'en';

  constructor(
    private sharedService: SharedService,
    private userService: UserService,
    private authService: AuthService,
    private location: Location
  ) {}

  ngOnInit() {
    this.setTitle(this.authService.isLoggedIn());
    this.getDependables(this.userService.user.main.lan);
    this.observe();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  private setTitle(isLoggedIn: boolean) {
    if (isLoggedIn) {
      this.sharedService.setPageTitle(null, 'Dashboard');
      this.location.go('/dashboard');
    } else {
      this.sharedService.setPageTitle(null, '');
      this.location.go('/home');
    }
  }

  private getDependables(lan) {
    const options = {
      lan,
      component: 'HomeComponent',
      getTranslations: true,
      getLicenses: true
    };

    this.sharedService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.licenses = dependables.licenseUrls;
        this.text = this.sharedService.getTranslatedText(dependables.translations);
      }
    );
  }

  private observe() {
    this.userService.interfaceLanguageChanged
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      newLan => this.getDependables(newLan)
    );
    this.sharedService.justLoggedInOut
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      loggedIn => this.setTitle(loggedIn)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
