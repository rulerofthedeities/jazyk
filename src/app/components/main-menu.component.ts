import {Component, OnInit, OnDestroy, HostListener, ElementRef} from '@angular/core';
import {Router, NavigationEnd} from '@angular/router';
import {UtilsService} from '../services/utils.service';
import {UserService} from '../services/user.service';
import {AuthService} from '../services/auth.service';
import {ErrorService} from '../services/error.service';
import {Translation} from '../models/course.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-main-menu',
  templateUrl: 'main-menu.component.html',
  styleUrls: ['main-menu.component.css']
})

export class MainMenuComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private url: string;
  text: Object = {};
  showDropDown = false;
  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      // Outside element, close dropdown
      this.showDropDown = false;
    }
  }

  constructor(
    private router: Router,
    private utilsService: UtilsService,
    private userService: UserService,
    private authService: AuthService,
    private errorService: ErrorService,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    this.getUrl();
    this.getTranslations();
  }

  onToggleDropDown() {
    event.preventDefault();
    this.showDropDown = !this.showDropDown;
  }

  onGoto(page: string) {
    this.router.navigate(['/user/', page]);
  }

  onLogOut() {
    event.preventDefault();
    this.authService.logout();
    this.userService.clearUser();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  private getUrl() {
    this.router.events
    .takeWhile(() => this.componentActive)
    .subscribe((route: NavigationEnd) => {
      this.url = route.url;
    });
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(this.userService.user.lan, 'MainMenuComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => this.text = this.utilsService.getTranslatedText(translations),
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
