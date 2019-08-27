import { Component, Input, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { SharedService } from 'app/services/shared.service';
import { StoriesService } from 'app/services/stories.service';
import { Book, UserBook, UserData, UserBookStatus } from '../../models/book.model';
import { RecentBook } from '../../models/dashboard.model';
import { LicenseUrl } from '../../models/main.model';
import { UserWordCount, UserWordData } from '../../models/word.model';
import { takeWhile } from 'rxjs/operators';
import { zip } from 'rxjs';

@Component({
  selector: 'km-recent-story',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'recent-story.component.html',
  styleUrls: ['../stories/story.summary.component.css', 'recent-story.component.css']
})

export class RecentStoryComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  @Input() licenses: LicenseUrl[];
  @Input() item: RecentBook;
  private componentActive = true;
  book: Book;
  userBook: UserBook;
  sessions: UserData[];
  currentUserData: UserData;
  bookType: string;
  targetLanCode: string;
  isError = false;
  bookReady = false;
  hasImage: boolean;
  hasAudioTitle: boolean;
  isFinished: boolean;
  coverImage: string;
  audioTitle: string;
  typeToolTip: string;
  userBookStatus: UserBookStatus;
  isProgressReady = false;
  hasFlashCards = false;
  userGlossaryCount: UserWordCount;
  glossaryCount: UserWordCount;

  constructor(
    private cdr: ChangeDetectorRef,
    private sharedService: SharedService,
    private storiesService: StoriesService
  ) {}

  ngOnInit() {
    if (this.item) {
      console.log(this.item);
      this.book = this.item.book;
      this.userBook = this.item.uBook;
      this.sessions = this.item.sessions;
      this.bookType = this.userBook ? this.userBook.bookType : '';
      this.targetLanCode = this.item.targetLanCode;
      this.setStatus();
      this.setCoverImage();
      this.setAudioFile();
      this.setToolTips();
      this.checkFinished();
      this.bookReady = true;
      if (this.bookType === 'glossary') {
        this.getGlossaryCount();
      } else {
        this.isProgressReady = true;
      }
    }
  }

  onAudioEnded(isEnded: boolean) {
    this.sharedService.audioHasEnded(isEnded);
  }

  private getGlossaryCount() {
    zip(
      this.storiesService.fetchStoryUserWords(this.targetLanCode, this.book._id),
      this.storiesService.fetchStoryBookWords(this.targetLanCode, this.book._id)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
      if (data && data.length) {
        this.processGlossaryData(data[0], data[1]);
      }
      this.isProgressReady = true;
      this.sharedService.detectChanges(this.cdr);
    });
  }

  private processGlossaryData(glossaryData: UserWordData, translationCount: UserWordCount) {
    this.glossaryCount = translationCount;
    this.hasFlashCards = this.storiesService.hasFlashCards(this.glossaryCount, this.userGlossaryCount);
    this.storiesService.checkGlossaryStatus(
      this.book,
      this.glossaryCount,
      this.userGlossaryCount,
      this.userBookStatus,
      this.userBook,
      glossaryData
    );
  }

  private setStatus() {
    this.userBookStatus = this.storiesService.resetBookStatus();
    this.storiesService.initBookStatus(this.book, this.userBookStatus, this.userBook);
    this.currentUserData = this.sessions[0]; // backend takes care of sorting
    console.log('current user data', this.currentUserData);
    this.storiesService.checkSentencesDone(this.book, this.currentUserData, this.userBookStatus);
  }

  private setCoverImage() {
    this.hasImage = !!this.book.coverImg;
    this.coverImage = this.sharedService.getCoverImagePath(this.book);
  }

  private setAudioFile() {
    if (this.book.audioTitle && this.book.audioTitle.s3 && this.book.audioTitle.hasMp3) {
      this.hasAudioTitle = true;
      this.audioTitle = this.sharedService.getAudioTitle(this.book);
    } else {
      this.hasAudioTitle = false;
    }
  }

  private setToolTips() {
    switch (this.bookType) {
      case 'listen': this.typeToolTip = this.text['Audiobook']; break;
      case 'glossary': this.typeToolTip = this.text['FlashCards']; break;
      default: this.typeToolTip = this.text['book'];
    }
  }

  private checkFinished() {
    if (this.userBook) {
      if ((this.userBook.bookmark && this.userBook.bookmark.isBookRead) || this.userBook.repeatCount > 0) {
        this.isFinished = true;
      }
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
    this.cdr.detach();
  }
}
