import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { RevisionService } from '../../services/revision.service';
import { SharedService } from '../../services/shared.service';
import { Book, UserBook, Chapter, Sentence, SessionData,
         RevisionTranslations, SentenceTranslation } from 'app/models/book.model';
import { SentenceData, ChapterData } from 'app/models/revision.model';
import { takeWhile, filter, delay } from 'rxjs/operators';
import { zip, Subject } from 'rxjs';

@Component({
  templateUrl: 'book-revision.component.html',
  styleUrls: ['../readnlisten/book-context.component.css', 'book-revision.component.css']
})

export class BookRevisionComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private bookType = 'read';
  text: Object;
  book: Book;
  isLoadingRevision = false;
  isLoadingChapter: boolean[] = [];
  userLanCode: string;
  msg: string;
  chapterData: ChapterData[] = [];
  userId: string;
  isError = false;

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

  onToggleChapter(chapter: ChapterData, i: number) {
    console.log('selected chapter', chapter);
    chapter.expanded = !chapter.expanded;
    if (chapter.expanded && !chapter.ready) {
      if (!chapter.ready) {
        this.fetchChapter(chapter, i);
      }
    }
  }

  showChapter(chapter: ChapterData) {
    const level = chapter.level;
    let sequence = chapter.sequence,
        chapterData: ChapterData,
        hide = true;
    if (level > 1) {
      while (sequence > 0) {
        sequence--;
        chapterData = this.chapterData.find(cd => cd.sequence === sequence && cd.level === level - 1);
        if (chapterData) {
          hide = !chapterData.expanded;
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
        const bookId = params['id'];
        this.userLanCode = params['lan'];
        this.processNewBookId(bookId);
        this.processNewBook(bookId);
      }
    );
  }

  private processNewBookId(bookId: string) {
    // First load book only for better responsiveness
    if (bookId && bookId.length === 24) {
      this.isLoadingRevision = true;
      this.readnListenService
      .fetchBook(bookId, this.bookType)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(book => {
        this.book = book;
      });
    } else {
      this.msg = this.text['InvalidBookId'];
    }
  }

  private processNewBook(bookId: string) {
    zip(
      this.readnListenService.fetchChapterHeaders(bookId, this.bookType),
      this.revisionService.fetchSessionData(bookId, 'read', this.userLanCode)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(res => {
      this.chapterData = this.processChapterHeaders(res[0]);
      this.processSessions(res[1]);
    });
  }

  private processChapterHeaders(chapters: Chapter[]): ChapterData[] {
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
        chapterId: chapter._id,
        title,
        sequence: chapter.sequence,
        level: chapter.level,
        nrOfSentences: chapter.nrOfSentences,
        sentences: sentences,
        expanded: false,
        ready: false
      });
    });
    this.isLoadingRevision = false;
    return chapterData;
  }

  private processSessions(sessions: SessionData[]) {
    console.log('session data', sessions);
    console.log('Chapter Data', this.chapterData);
  }

  private fetchChapter(chapter: ChapterData, i: number) {
    this.isLoadingChapter[i] = true;
    zip(
      this.revisionService.fetchChapter(chapter.chapterId),
      this.revisionService.fetchChapterTranslations(this.book._id, this.book.lanCode, this.userLanCode, chapter.sequence)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
      console.log('loaded chapter', data, chapter.sentences);
      if (data[0] && data[0].sentences) {
        data[0].sentences.forEach((sentence, i) => {
          chapter.sentences[i].sentence = sentence;
        });
      }
      const translations = data[1];
      // Map translations with chapter sentences
      if (translations) {
        let sentence: SentenceData;
        console.log('translations', translations);
        translations.forEach(translation => {
          sentence = chapter.sentences.find(chapterSentence => chapterSentence.sentence.text === translation.sentence);
          sentence.translations = translation.translations;
          sentence.bestTranslation = this.getBestTranslation(translation.translations);
        });
      }
      this.isLoadingChapter[i] = false;
      chapter.ready = true;
      console.log('chapter data', chapter);
    });
  }

  private getBestTranslation(translations: SentenceTranslation[]): SentenceTranslation {
    let bestTranslation: SentenceTranslation;
    translations.forEach(translation => {
      if (!bestTranslation || bestTranslation.score < translation.score) {
        bestTranslation = translation;
      }
    });
    return bestTranslation;
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
