import { Component, OnInit, OnDestroy } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { PageService } from '../../services/page.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { Map, LicenseUrl, Language } from '../../models/main.model';
import { BooksByLan } from '../../models/page.model';
import { takeWhile } from 'rxjs/operators';

interface LocalLan {
  lanCode: string;
  lanName: string;
}

@Component({
  templateUrl: 'book-list.component.html',
  styleUrls: [`book-list.component.css`]
})

export class BooklistComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};
  userLan: string;
  isLoadingBooks = false;
  isLoadingAudio = false;
  isReady = false;
  languages: LocalLan[];
  languagesRead: LocalLan[];
  languagesListen: LocalLan[];
  licenses: LicenseUrl[];
  books: BooksByLan[];
  audiobooks: BooksByLan[];
  nrOfBooks = 0;
  nrOfAudio = 0;
  selected: Map<number> = {};

  constructor(
    private userService: UserService,
    private sharedService: SharedService,
    private pageService: PageService,
    private meta: Meta
  ) {}

  ngOnInit() {
    this.userLan = this.userService.user.main.lan;
    this.getDependables();
    this.setMetaTags();
  }

  onSelect(i: number, tpe: string) {
    if (i === this.selected[tpe]) {
      this.selected[tpe] = null;
    } else {
      this.selected[tpe] = i;
    }
  }

  private getDependables() {
    const options = {
      lan: this.userLan,
      component: 'ReadComponent',
      getTranslations: true,
      getLanguages: true,
      getLicenses: true
    };
    this.sharedService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.licenses = dependables.licenseUrls;
        this.text = this.sharedService.getTranslatedText(dependables.translations);
        this.sharedService.setPageTitle(this.text, 'BookList');
        this.languages = this.processBookLanguages(dependables.bookLanguages);
        this.getBooks();
        this.getAudioBooks();
        this.isReady = true;
      }
    );
  }

  private processBookLanguages(languages: Language[]): LocalLan[] {
    // Get local translation for all book languages
    const localLans = languages.map(language => {
      return {lanCode: language.code, lanName: this.text[language.name]};
    });
    // Then sort according to the local translation
    localLans.sort(
      (a, b) => (a.lanName > b.lanName) ? 1 : ((b.lanName > a.lanName) ? -1 : 0)
    );
    return localLans;
  }

  private getBooks() {
    this.isLoadingBooks = true;
    this.pageService
    .getBookList('read')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      bookList => {
        this.books = this.sortBooks(bookList);
        this.nrOfBooks = this.countBooks(bookList);
        this.isLoadingBooks = false;
      }
    );
  }

  private getAudioBooks() {
    this.isLoadingAudio = true;
    this.pageService
    .getBookList('listen')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      bookList => {
        this.isLoadingAudio = false;
        this.audiobooks = this.sortBooks(bookList);
        this.nrOfAudio = this.countBooks(bookList);
      }
    );
  }

  private getLinks(booklans: BooksByLan) {
    let bookLinks: {authorsTxt: string, linksTxt: string};
    const links: string[] = [];
    booklans.books.map(book => {
      bookLinks = this.sharedService.getAuthorsLinksTxt(book) || {authorsTxt: '', linksTxt: ''};
      links.push(bookLinks.linksTxt);
    });
    return links;
  }

  private sortBooks(books: BooksByLan[]): BooksByLan[] {
    const sortedBooks = [];
    let bookList: BooksByLan,
        newList: BooksByLan;
    this.languages.forEach(lan => {
      bookList = books.find(book => book.lanCode === lan.lanCode);
      if (bookList) {
        newList = {
          books: bookList.books,
          lanCode: bookList.lanCode,
          lanName: lan.lanName,
          total: bookList.books.length,
          links: this.getLinks(bookList)
        };
        sortedBooks.push(newList);
      }
    });
    return sortedBooks;
  }

  private countBooks(lans: BooksByLan[]): number {
    let total = 0;
    lans.forEach(lan => total += lan.books.length);
    return total;
  }

  private setMetaTags() {
    const isoCode = this.sharedService.getContentLanguageCode(this.userLan);
    this.meta.addTag({'http-equiv': 'Content-Language', content: isoCode});
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
