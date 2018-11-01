import { Component, OnInit, OnDestroy, ViewChild, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { SharedService } from '../../services/shared.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { LicenseUrl, Dependables, DependableOptions } from '../../models/main.model';
import { retry, tap, takeWhile } from 'rxjs/operators';

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
    private authService: AuthService,
    private location: Location,
    private http: HttpClient,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    console.log('setting title');
    this.setTitle(this.authService.isLoggedIn());
    console.log('getting dependables');
    this.getDependables(this.userService.user.main.lan);
    console.log('observables');
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

    // if (isPlatformBrowser(this.platformId)) {
      // Client only code.
      this.sharedService
      .fetchDependables(options)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        dependables => {
          console.log('dependables', dependables);
          this.licenses = dependables.licenseUrls;
          this.text = this.sharedService.getTranslatedText(dependables.translations);
        },
        error => {
          console.log('error getting dependables home', error);
        }
      );
    // }
/*
    this.getData(options).then((results) => {
      console.log('Fetched dependables async', results);
    }).catch((err) => {
      console.log('Error fetching dependables async', err);
    });
    */
  }


  private async getData(options: DependableOptions): Promise<Dependables> {
    const data = await this.sharedService
    .fetchDependables(options)
        .toPromise()
        .then(result => result as Dependables);
    return data;
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
