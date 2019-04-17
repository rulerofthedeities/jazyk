import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { UserService } from '../../services/user.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { RevisionService } from '../../services/revision.service';
import { SharedService } from '../../services/shared.service';
import { Language } from '../../models/main.model';
import { Book, Chapter, SessionData,
         RevisionTranslations, SentenceTranslation, UserBook } from 'app/models/book.model';
import { SentenceData, ChapterData } from 'app/models/revision.model';
import { takeWhile, filter } from 'rxjs/operators';
import { zip } from 'rxjs';

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
  targetLanCode: string;
  msg: string;
  chapterData: ChapterData[] = [];
  userId: string;
  isError = false;
  hasChapters: boolean;
  userLanguages: Language[];
  bookRead: boolean;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private userService: UserService,
    private sharedService: SharedService,
    private revisionService: RevisionService,
    private readnListenService: ReadnListenService
  ) {}

  ngOnInit() {
    this.getBookType();
    this.getDependables(this.userService.user.main.lan);
  }

  onToggleChapter(chapter: ChapterData, i: number) {
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
        this.targetLanCode = this.checkValidLan(params['lan'], bookId);
        this.processNewBookId(bookId);
      }
    );
  }

  private processNewBookId(bookId: string) {
    // First load book only for better responsiveness
    if (bookId && bookId.length === 24) {
      this.isLoadingRevision = true;
      zip(
        this.readnListenService.fetchBook(bookId, this.bookType),
        this.readnListenService.fetchUserBook(this.targetLanCode, bookId, false)
      )
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(data => {
        this.book = data[0];
        const userBook = data[1];
        this.processNewBook(bookId, userBook);
      });
    } else {
      this.msg = this.text['InvalidBookId'];
    }
  }

  private processNewBook(bookId: string, userBook: UserBook) {
    this.bookRead = true;
    if (userBook && userBook.repeatCount > 0 || (userBook.bookmark && userBook.bookmark.isBookRead)) {
      this.fetchBookData(bookId);
    } else {
      this.bookRead = false;
      this.isLoadingRevision = false;
      this.msg = this.text['BookNotReadYet'];
    }
  }

  private fetchBookData(bookId: string) {
    zip(
      this.readnListenService.fetchChapterHeaders(bookId, this.bookType),
      this.revisionService.fetchSessionData(bookId, 'read', this.targetLanCode)
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
        const currentSentenceNr = newChapters[newChapters.length - 1].nrOfSentences;
        newChapters[newChapters.length - 1].nrOfSentences += chapter.nrOfSentences;
        newChapters[newChapters.length - 1].mergedChapters.push({
          chapterId: chapter._id,
          sentenceNrStart: currentSentenceNr
        });
      } else {
        chapter.mergedChapters = [];
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
        mergedChapters: chapter.mergedChapters,
        title,
        sequence: chapter.sequence,
        level: chapter.level,
        nrOfSentences: chapter.nrOfSentences,
        sentences: sentences,
        paragraphs: [],
        expanded: false,
        ready: false
      });
    });
    if (chapterData.length < 2 && chapterData[0].title === '') {
      this.hasChapters = false;
      chapterData[0].expanded = true;
      this.fetchChapter(chapterData[0], 0);
    } else {
      this.hasChapters = true;
    }
    this.isLoadingRevision = false;
    return chapterData;
  }

  private processSessions(sessions: SessionData[]) {
    // Loop through all session data and map with chapter
    // If chapterSentenceNr or chapter sequence is available, this gets priority
    let chapterSequence = 1,
        sentenceNr = 0,
        currentRepeatCount = -1,
        repeatCount: number;
    sessions.forEach(session => {
      repeatCount = session.repeatCount || 0;
      if (repeatCount > currentRepeatCount) {
        currentRepeatCount = repeatCount;
        chapterSequence = 1;
        sentenceNr = 0;
      }
      if (session.chapterSequence) {
        chapterSequence = session.chapterSequence;
        sentenceNr = session.sentenceNrChapter || 0;
      }
      for (let i = 0; i < session.answers.length; i++) {
        this.chapterData[chapterSequence - 1].sentences[sentenceNr].answers =
          this.chapterData[chapterSequence - 1].sentences[sentenceNr].answers || '';
        this.chapterData[chapterSequence - 1].sentences[sentenceNr].answers += session.answers[i];
        this.chapterData[chapterSequence - 1].sentences[sentenceNr].lastAnswer = session.answers[i];
        sentenceNr++;
        if (sentenceNr >= this.chapterData[chapterSequence - 1].nrOfSentences) {
          chapterSequence++;
          sentenceNr = 0;
        }
      }
    });
  }

  private fetchChapter(chapter: ChapterData, i: number, sentenceNrStart = 0) {
    this.isLoadingChapter[i] = true;
    zip(
      this.revisionService.fetchChapter(chapter.chapterId),
      this.revisionService.fetchChapterTranslations(this.book._id, this.book.lanCode, this.targetLanCode, chapter.sequence)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
      const chapterData = data[0],
            translations = data[1];
      let translationData: RevisionTranslations;
      if (chapterData && chapterData.sentences) {
        chapterData.sentences.forEach((sentence, j) => {
          if (!chapter.sentences[sentenceNrStart + j].sentence) {
            chapter.sentences[sentenceNrStart + j].sentence = sentence;
            // Map translations with chapter sentences
            translationData = translations.find(translation =>
              chapter.sentences[sentenceNrStart + j].sentence.text === translation.sentence
            );
            if (translationData) {
              chapter.sentences[sentenceNrStart + j].hasTranslation = true;
              chapter.sentences[sentenceNrStart + j].translations = translationData.translations;
              chapter.sentences[sentenceNrStart + j].bestTranslation = this.getBestTranslation(translationData.translations);
            } else {
              chapter.sentences[sentenceNrStart + j].hasTranslation = false;
              chapter.sentences[sentenceNrStart + j].bestTranslation = {
                translation: chapter.sentences[sentenceNrStart + j].sentence.text,
                userId: null,
                note: '',
                isMachine: false,
                lanCode: this.targetLanCode,
                score: 0
              };
            }
          }
        });
      }
      // Transform into paragraphs
      this.buildParagraphs(chapter);
      if (chapter.mergedChapters.length > 0) {
        chapter.chapterId = chapter.mergedChapters[0].chapterId;
        chapter.sequence++;
        const newSentenceNrStart = chapter.mergedChapters[0].sentenceNrStart;
        chapter.mergedChapters.shift();
        this.fetchChapter(chapter, i, newSentenceNrStart);
      } else {
        this.isLoadingChapter[i] = false;
        chapter.ready = true;
        chapterData.sentences = [];
      }
    });
  }

  private buildParagraphs(chapterData: ChapterData) {
    // For display arrange sentences per paragraph
    let pCnt = -1,
        sCnt = 0;
        chapterData.paragraphs = [];
    chapterData.sentences.forEach(sentenceData => {
      if (sCnt === 0 || (sentenceData.sentence && sentenceData.sentence.isNewParagraph)) {
        pCnt++;
        sCnt = 0;
        chapterData.paragraphs[pCnt] = [];
      }
      if (!chapterData.paragraphs[pCnt][sCnt]) {
        chapterData.paragraphs[pCnt][sCnt] = sentenceData;
      }
      sCnt++;
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

  private checkValidLan(lan: string, bookId: string): string {
    // Check if lan from route is valid
    // If not, change lan and route
    const isValidLan = !!this.userLanguages.find(userLan => userLan.code === lan);
    if (isValidLan) {
      return lan;
    } else {
      const targetLan = this.userService.user.main.myLan;
      this.location.go('/read/book/' + bookId + '/' + targetLan + '/review');
      return targetLan;
    }
  }

  private getDependables(lan) {
    const options = {
      lan,
      component: 'RevisionComponent',
      getTranslations: true,
      getLanguages: true
    };

    this.sharedService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.userLanguages = dependables.userLanguages;
        this.text = this.sharedService.getTranslatedText(dependables.translations);
        this.getBookId();
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
