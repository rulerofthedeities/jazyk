import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReadService } from '../../services/read.service';
import { UserService } from '../../services/user.service';
import { UtilsService } from '../../services/utils.service';
import { Language } from '../../models/course.model';
import { Book } from '../../models/book.model';
import { takeWhile } from 'rxjs/operators';

@Component({
  templateUrl: 'read.component.html',
  styleUrls: ['read.component.css']
})

export class ReadComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};
  selectedLanguage: Language;
  languages: Language[];
  books: Book[];
  isLoading = false;
  isError = false;
  isReady = false;
  IsBooksReady = false;

  constructor(
    private readService: ReadService,
    private userService: UserService,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.getDependables();
  }

  onLanguageSelected(lan: Language) {
    this.selectedLanguage = lan;
    this.getBooks();
  }

  onChangeBookType(tpe: string) {
    console.log('new tpe', tpe);
  }

  private getBooks() {
    this.isLoading = true;
    this.readService
    .fetchPublishedBooks(this.selectedLanguage.code)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      books => {
        console.log('books', books);
        this.books = books;
        this.isLoading = false;
        this.IsBooksReady = true;
      }
    );
  }

  private getDependables() {
    const options = {
      lan: this.userService.user.main.lan,
      component: 'ReadComponent',
      getTranslations: true,
      getLanguages: true
    };
    this.utilsService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.text = this.utilsService.getTranslatedText(dependables.translations);
        this.setActiveLanguages(dependables.languages);
        this.utilsService.setPageTitle(this.text, 'Read');
        this.getBooks();
        this.isReady = true;
      }
    );
  }

  private setActiveLanguages(languages: Language[]) {
    this.languages = languages; // .filter(language => language.active);
    const allLanguage = this.utilsService.getAllLanguage();
    this.languages.unshift(allLanguage);
    console.log('languages', this.languages);
    this.selectedLanguage = this.userService.getUserLearnLanguage(this.languages);
  }
  ngOnDestroy() {
    this.componentActive = false;
  }
}
