import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageService } from '../../services/page.service';
import { SharedService } from '../../services/shared.service';
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
  nextPage: ManualIndex;
  index: ManualIndex[];
  isIndex = false;
  sectionClosed: boolean[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pageService: PageService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.page))
    .subscribe(
      params => {
        if (params['page']) {
          this.nextPage = null;
          const pageName = params['page'].toLowerCase();
          if (pageName === 'index') {
            this.isIndex = true;
            this.getDependables();
          } else {
            this.isIndex = false;
            this.getManualPage(pageName);
          }
          this.getManualIndex(); // also required for navigation
        }
      }
    );
  }

  onGoToManualPage(item: ManualIndex) {
    if (item.isHeader) {
      this.sectionClosed[item.sort] = !this.sectionClosed[item.sort];
    } else {
      this.router.navigate(['/manual/', item.name]);
    }
  }

  onReturnToIndex() {
    this.router.navigate(['/manual/index']);
  }

  onGoToNextPage(nextPage: Page) {
    console.log('go to next page', nextPage);
    if (nextPage) {
      this.router.navigate(['/manual/', nextPage.name]);
    }
  }

  isSectionClosed(item: ManualIndex): boolean {
    const levels = item.sort.split('.');
    let parent: string,
        closed = false;
    // check if one of the parents is closed
    for (let i = 0; i < levels.length - 1; i++) {
      parent = item.sort.split('.', i + 1).join('.');
      if (this.sectionClosed[parent]) {
        closed = true;
      }
    }
    return closed;
  }

  getPath(item: ManualIndex): string {
    return encodeURIComponent(item.name);
  }

  getRoute(event: any) {
    const tpe = event.target.getAttribute('data-tpe');
    if (event.target && event.target.getAttribute('href') && tpe !== 'ext') {
      event.preventDefault();
      this.router.navigate([event.target.getAttribute('href')]);
    }
  }

  private getManualIndex() {
    this.pageService
    .fetchManualIndex()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      index => {
        console.log('index?', this.isIndex);
        if (this.isIndex) {
          this.index = this.processIndex(index);
          this.setPageTitle();
        } else {
          const nextIndex = index.filter(page => page.isHeader !== true);
          this.setNextPage(nextIndex);
        }
      }
    );
  }

  private getManualPage(pageName: string) {
    this.pageService
    .fetchManualPage(pageName)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      page => {
        this.page = page;
        this.setPageTitle();
      }
    );
  }

  private setNextPage(nextIndex: ManualIndex[]) {
    let nextPage: ManualIndex,
        index: number;
    console.log('page', this.page);
    console.log('next index', nextIndex);
    if (nextIndex) {
      index = nextIndex.findIndex(page => page.name === this.page.name);
    }
    if (index) {
      nextPage = nextIndex[index + 1];
    }
    this.nextPage = nextPage;
  }

  private processIndex(index: ManualIndex[]): ManualIndex[] {
    index.forEach(item => {
      item.level = item.sort.split('.').length;
    });
    return index;
  }

  private setPageTitle() {
    if (this.text) {
      if (!this.isIndex && this.page && this.page.title) {
        this.sharedService.setPageTitle(null, this.text['Manual'] + ' - ' + this.page.title);
      }  else {
        this.sharedService.setPageTitle(this.text, 'Manual');
      }
    }
  }

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
      this.setPageTitle();
    }
  );
}

  ngOnDestroy() {
    this.componentActive = false;
  }
}
