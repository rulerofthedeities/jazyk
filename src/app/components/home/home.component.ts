import { Component, OnInit, OnDestroy } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { takeWhile } from 'rxjs/operators';
import { LicenseUrl } from '../../models/main.model';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.css']
})

export class HomeComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};
  licenses: LicenseUrl[];

  constructor(
    private sharedService: SharedService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('setting title');
    this.setTitle(this.authService.isLoggedIn());
    console.log('getting dependables');
    this.getDependables(this.userService.user.main.lan);
    console.log('observables');
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
      this.sharedService.setPageTitle(null, 'Dashboard');
    } else {
      this.sharedService.setPageTitle(null, '');
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

  ngOnDestroy() {
    this.componentActive = false;
  }
}
