import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { RevisionService } from '../../services/revision.service';
import { SharedService } from '../../services/shared.service';
import { Book, UserBook, Chapter, Sentence, SessionData,
         RevisionTranslations, SentenceTranslation } from 'app/models/book.model';
import { takeWhile, filter, delay } from 'rxjs/operators';
import { zip, Subject } from 'rxjs';
import { Title } from '@angular/platform-browser';

interface SentenceData {
  sentenceNrChapter: number;
  sentenceNrTotal: number;
  sentence?: Sentence;
  // sentenceId?: string;
  answers?: string;
  // lastAnswer?: string;
  // translations?: SentenceTranslation[];
  // bestTranslation?: SentenceTranslation;
}

interface ChapterData {
  title: string;
  level: number;
  sequence: number;
  nrOfSentences: number;
  sentences: SentenceData[];
  expanded: boolean;
}

@Component({
  templateUrl: 'book-revision.component.html',
  styleUrls: ['../readnlisten/book-context.component.css', 'book-revision.component.css']
})

export class BookRevisionComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object;
  book: Book;
  userBook: UserBook;
  isLoadingRevision = false;
  bookType = 'read';
  bookId: string;
  userLanCode: string;
  msg: string;
  // chapters: Chapter[];
  // sessions: SessionData[];
  // sentenceData: SentenceData[][] = [];
  chapterData: ChapterData[] = [];
  userId: string;
  currentChapterTitle = '';

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private sharedService: SharedService,
    private revisionService: RevisionService,
    private readnListenService: ReadnListenService
  ) {}

  ngOnInit() {
    this.userId = this.userService.user._id.toString();
    this.getBookType();
    this.getDependables(this.userService.user.main.lan);
  }

  onToggleChapter(chapter: ChapterData) {
    console.log('selected chapter', chapter);
    chapter.expanded = !chapter.expanded;
  }

  showChapter(chapter: ChapterData) {
    const level = chapter.level;
    let sequence = chapter.sequence,
        chapter: ChapterData,
        hide = true;
    if (level > 1) {
      while (sequence > 0) {
        sequence--;
        chapter = this.chapterData.find(cd => cd.sequence === sequence && cd.level === level - 1);
        if (chapter) {
          hide = !chapter.expanded;
        }
      }
      return hide;
    } else {
      return false;
    }
  }

  private getBookType() {
    // read or listen
    this.route
    .data
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
      this.bookType = data.tpe;
    });
  }

  private getBookId() {
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.id))
    .subscribe(
      params => {
        this.bookId = params['id'];
        this.userLanCode = params['lan'];
        this.processNewBookId();
      }
    );
  }

  private processNewBookId() {
    if (this.bookId && this.bookId.length === 24) {
      this.isLoadingRevision = true;
      zip(
        this.readnListenService.fetchBook(this.bookId, this.bookType),
        this.readnListenService.fetchChapterHeaders(this.bookId, this.bookType),
        this.revisionService.fetchSessionData(this.bookId, 'read', this.userLanCode)
      )
      .pipe(takeWhile(() => this.componentActive), delay(2000))
      .subscribe(res => {
        this.book = res[0];
        // this.chapters = res[1];
        // this.sessions = res[2];
        this.chapterData = this.processChapters(res[1]);
        this.processSessions(res[2]);
      });
    } else {
      this.msg = this.text['InvalidBookId'];
    }
  }

  private processChapters(chapters: Chapter[]): ChapterData[] {
    // Merge chapters without a chapter title
    const newChapters: Chapter[] = [];
    chapters.forEach((chapter, i) => {
      if (i > 0 && chapter.title.trim() === '') {
        // merge with previous chapter
        newChapters[newChapters.length - 1].nrOfSentences += chapter.nrOfSentences;
      } else {
        newChapters.push(chapter);
      }
    });
    // Create a data structure holding all data per chapter,
    const chapterData: ChapterData[] = [];
    let j = 0,
        title: string,
        sentences: SentenceData[];
    newChapters.forEach(chapter => {
      title = chapter.title.trim();
      sentences = [];
      for (let i = 0; i < chapter.nrOfSentences; i++) {
        sentences[i] = {
          sentenceNrChapter: i,
          sentenceNrTotal: j
        };
        j++;
      }
      chapterData.push({
        title,
        sequence: chapter.sequence,
        level: chapter.level,
        nrOfSentences: sentences.length,
        sentences,
        expanded: false
      });
    });
    this.isLoadingRevision = false;
    return chapterData;
  }

  private processSessions(sessions: SessionData[]) {
    console.log('session data', sessions);
    console.log('Chapter Data', this.chapterData);
  }

  private getDependables(lan) {
    const options = {
      lan,
      component: 'RevisionComponent',
      getTranslations: true
    };

    this.sharedService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.text = this.sharedService.getTranslatedText(dependables.translations);
        this.getBookId();
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
