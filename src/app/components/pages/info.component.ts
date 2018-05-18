import {Component, OnInit, OnDestroy, HostListener} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Meta} from '@angular/platform-browser';
import {PageService} from '../../services/page.service';
import {UserService} from '../../services/user.service';
import {UtilsService} from '../../services/utils.service';
import {AuthService} from '../../services/auth.service';
import {ErrorService} from '../../services/error.service';
import {Page} from '../../models/page.model';
import {takeWhile, filter} from 'rxjs/operators';

@Component({
  template: `
  <div class="panel panel-default transparant">
    <div class="panel-heading">
      <span class="fa fa-info-circle fa-spacing-title"></span>{{page?.title}}
    </div>
    <div class="panel-body">
      <div [innerHTML]="page?.html | sanitizeHtml">
    </div>
  </div>
  `,
  styleUrls: ['page.component.css']
})

export class InfoComponent implements OnInit, OnDestroy {
  private componentActive = true;
  page: Page;

  // Listen for route link events
  @HostListener('window:route-event', ['$event', '$event.detail.route'])
  updateNodes(event, route) {
    if (route) {
      route = route.substr(0, 1) === '/' ? route : '/' + route;
      if (route === '/courses') {
        if (this.authService.isLoggedIn()) {
          route = '/learn/courses'; // courses route is only available when logged on
        } else {
          route = '/learn';
        }
      }
      this.router.navigate([route]);
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private meta: Meta,
    private userService: UserService,
    private authService: AuthService,
    private pageService: PageService,
    private utilsService: UtilsService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.page))
    .subscribe(
      params => this.fetchInfoPage(params['page'].toLowerCase())
    );
    this.pageService.loadRouteScript(); // For route links
  }

  private fetchInfoPage(page: string) {
    this.pageService
    .fetchInfoPage(page, this.userService.user.main.lan)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      fetchedPage => {
        this.page = fetchedPage;
        this.utilsService.setPageTitle(null, fetchedPage.title);
        if (this.page.index === false) {
          this.meta.addTag({name: 'robots', content: 'noindex'});
        }
      },
      error => {
        if (error.status === 404) {
          this.router.navigate(['/404']);
        } else {
          this.errorService.handleError(error);
        }
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
