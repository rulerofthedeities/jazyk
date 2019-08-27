import { Component, Input, ChangeDetectionStrategy, OnDestroy,
         Renderer2, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { PlatformService } from '../../services/platform.service';
import { SharedService } from 'app/services/shared.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { UserService } from '../../services/user.service';
import { Book, UserBookStatus, UserBook } from '../../models/book.model';
import { UserWordCount } from '../../models/word.model';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-story-buttons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'story-buttons.component.html',
  styleUrls: ['story-buttons.component.css']
})

export class StoryButtonsComponent implements OnDestroy {
  @Input() text: Object;
  @Input() book: Book;
  @Input() bookType: string;
  @Input() glossaryType = 'all';
  @Input() targetLanCode: string;
  @Input() isTest = false;
  @Input() isCompact = false;
  @Input() isLarge = true;
  @Input() userBook: UserBook;
  @Input() userBookStatus: UserBookStatus;
  @Input() isFinished: boolean;
  @Input() hasFlashCards: boolean;
  @Input() glossaryCount: UserWordCount;
  @Input() userGlossaryCount: UserWordCount;
  @ViewChild('flashcardDropdown') flashcardDropdown: ElementRef;
  private componentActive = true;
  showFlashCardDropdown = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private platform: PlatformService,
    private userService: UserService,
    private readnListenService: ReadnListenService,
    private sharedService: SharedService,
    renderer: Renderer2
  ) {
    if (this.platform.isBrowser) {
      renderer.listen(document, 'click', (event) => {
        if (this.flashcardDropdown && !this.flashcardDropdown.nativeElement.contains(event.target)) {
          // Outside flashcard dropdown, close dropdown
          this.showFlashCardDropdown = false;
          this.sharedService.detectChanges(cdr);
        }
      });
    }
  }

  onStartReadingListening(isRepeat = false, isTest = false, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.userService.setLanCode(this.book.lanCode);
    this.userService.setUserLanCode(this.targetLanCode);
    if (isRepeat) {
      this.readnListenService
      .subscribeRepeat(this.book._id, this.targetLanCode, this.bookType, this.userBook.bookmark, isTest)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(subscription => {
        this.startReadingListening(this.book._id, this.targetLanCode, this.bookType, isTest);
      });
    } else {
      this.readnListenService
      .subscribeToBook(this.book._id, this.targetLanCode, this.bookType, isTest)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(subscription => {
        this.startReadingListening(this.book._id, this.targetLanCode, this.bookType, isTest);
      });
    }
  }

  onStartListeningTest() {
    this.userService.setLanCode(this.book.lanCode);
    this.userService.setUserLanCode(this.targetLanCode);
    this.readnListenService
    .subscribeToBook(this.book._id, this.targetLanCode, 'listen', true)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(subscription => {
      this.startReadingListening(this.book._id, this.targetLanCode, this.bookType, true);
    });
  }

  onStartVocabularyTest() {
    // console.log('start vocabulary test');
  }

  onWordList() {
    this.router.navigate([`/glossaries/glossary/${this.book._id}/${this.targetLanCode}`]);
  }

  onToggleFlashCardDropdown() {
    this.showFlashCardDropdown = !this.showFlashCardDropdown;
  }

  onStartFlashcards(tpe: string, count: number) {
    if (count > 0) {
      this.log(`Start flash cards for '${this.book.title}'`);
      this.router.navigate([`/glossaries/glossary/flashcards/${this.book._id}/${this.targetLanCode}/${tpe}`]);
    }
  }

  onRevision() {
    this.log(`Start revision for '${this.book.title}'`);
    this.router.navigate([`/read/book/${this.book._id}/${this.targetLanCode}/review`]);
  }

  private startReadingListening(bookId: string, targetLanCode: string, bookType: string, isTest: boolean) {
    if (isTest) {
      this.log(`Start listening test for '${this.book.title}'`);
      this.router.navigate([`/listen/book/${bookId}/${targetLanCode}/test`]);
    } else {
      if (bookType === 'listen') {
        this.log(`Start listening to '${this.book.title}'`);
        this.router.navigate([`/listen/book/${bookId}/${targetLanCode}`]);
      } else {
        this.log(`Start reading '${this.book.title}'`);
        this.router.navigate([`/read/book/${bookId}/${targetLanCode}`]);
      }
    }
  }

  private log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'StoryButtonsComponent'
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
    this.cdr.detach();
  }
}
