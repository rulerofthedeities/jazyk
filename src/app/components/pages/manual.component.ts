import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { PageService } from '../../services/page.service';
import { SharedService } from '../../services/shared.service';
import { AuthService } from '../../services/auth.service';
import { ErrorService } from '../../services/error.service';
import { Map } from '../../models/main.model';
import { Page, ManualIndex } from '../../models/page.model';
import { takeWhile, filter } from 'rxjs/operators';

@Component({
  templateUrl: 'manual.component.html',
  styleUrls: ['manual.component.css', 'page.component.css']
})

export class ManualComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object;
  page: Page;
  index: ManualIndex[];
  isIndex = false;
  isSectionClosed: boolean[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private meta: Meta,
    private authService: AuthService,
    private pageService: PageService,
    private sharedService: SharedService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.page))
    .subscribe(
      params => {
        console.log('manual params', params);
        const pageId = params['page'].toLowerCase();
        if (pageId === 'index') {
          this.isIndex = true;
          this.getDependables();
          this.getManualIndex();
        } else {
          this.isIndex = false;
          this.getManualPage(pageId);
        }
      }
    );
  }

  onGoToManualPage(item: ManualIndex) {
    if (item.level > 1) {
      console.log('go to page', item);
      this.router.navigate(['/manual/', item.name]);
    } else {
      this.isSectionClosed[item.nr] = !this.isSectionClosed[item.nr];
      console.log(item.nr, this.isSectionClosed[item.nr]);
    }
  }

  onReturnToIndex() {
    this.router.navigate(['/manual/index']);
  }

  getDisplay(nr: string): string {
    console.log('display', this.isSectionClosed[nr] ? 'hidden' : 'block');
    return this.isSectionClosed[nr] ? 'hidden' : 'block';
  }

  private getManualIndex() {
    this.pageService
    .fetchManualIndex()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      index => {
        this.index = this.processIndex(index);
        console.log('index', index);
      }
    );
  }

  private getManualPage(pageId: string) {
    this.pageService
    .fetchManualPage(pageId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      page => {
        this.page = page;
        console.log('page', page);
      }
    );
  }

  private processIndex(index: ManualIndex[]): ManualIndex[] {
    index.forEach(item => {
      item.level = item.sort.split('.').length;
      item.nr = parseInt(item.sort.split('.')[0], 10);
    });
    return index;
  }
/*

  private setMetaTags(page: Page) {
    this.page = page;
    this.sharedService.setPageTitle(null, page.title);
    // Add meta tags
    if (page.index === false) {
      this.meta.addTag({name: 'robots', content: 'noindex'});
    }
    const isoCode = this.sharedService.getContentLanguageCode(this.lanCode);
    this.meta.addTag({'http-equiv': 'Content-Language', content: isoCode});
  }
*/

private getDependables() {
  const options = {
    lan: 'en',
    component: 'PageComponent',
    getTranslations: true
  };
  this.sharedService
  .fetchDependables(options)
  .pipe(takeWhile(() => this.componentActive))
  .subscribe(
    dependables => {
      this.text = this.sharedService.getTranslatedText(dependables.translations);
      this.sharedService.setPageTitle(this.text, 'Manual');
    }
  );
}

  ngOnDestroy() {
    this.componentActive = false;
  }
}
