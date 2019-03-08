import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { RevisionService } from '../../services/revision.service';
import { SharedService } from '../../services/shared.service';
import { Book, UserBook, Chapter, Sentence, SessionData,
         RevisionTranslations, SentenceTranslation, ChapterData } from 'app/models/book.model';
import { takeWhile, filter } from 'rxjs/operators';
import { zip, Subject } from 'rxjs';

interface SentenceData {
  sentence: Sentence;
  sentenceId: string;
  answers: string;
  lastAnswer: string;
  translations: SentenceTranslation[];
  bestTranslation: SentenceTranslation;
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
  isLoading = false;
  bookType = 'read';
  bookId: string;
  userLanCode: string;
  msg: string;
  chapters: Chapter[];
  currentChapterId: string;
  currentChapterTitle: string;
  currentParagraph: number;
  currentSentence: number;
  currentIndex: number[] = [0, 0, 0, 0, 0];
  hoverParagraph: number;
  hoverSentence: number;
  hasChapters = false;
  answers: string[];
  translations: RevisionTranslations[];
  chapterData: SentenceData[][]; // Split into paragraphs to they can be aligned with translations
  userId: string;
  answersObservable: Subject<{answers: string, isResults: boolean}> = new Subject(); // For translations

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

  showChapter(chapter: Chapter) {
    return (chapter.level === 1) || this.isParentChapterSelected(chapter);
  }

  getChevron(chapter: Chapter) {
    return this.isChapterSelected(chapter) ? 'fa-chevron-down' : 'fa-chevron-right';
  }

  onSelectSentence(parNr: number, lineNr, tpe: string, answer: string) {
    this.currentParagraph = parNr;
    this.currentSentence = lineNr;
    if (tpe === 'translation') {
      this.answersObservable.next({answers: answer, isResults: false});
    }
  }

  onSelectChapter(chapter: Chapter) {
    if (this.currentChapterId === chapter._id) {
      this.currentChapterId = null;
      this.chapterData = null;
      for (let i = chapter.level - 1; i < 5; i++) {
        if (this.currentIndex[i]) {
          this.currentIndex[i] = 0;
        }
      }
    } else {
      this.currentChapterId = chapter._id;
      this.currentIndex = [...chapter.index];
      this.getCurrentChapter(chapter._id, chapter.merged, true); // Get chapterdata
    }
  }

  onHoverSentence(parNr: number, lineNr, tpe: string) {
    this.hoverParagraph = parNr;
    this.hoverSentence = lineNr;
  }

  onCancelHoverSentence() {
    this.hoverParagraph = null;
    this.hoverSentence = null;
  }

  onTranslationAdded(points: string) {
    console.log('translation added', points);
  }

  onCanConfirm() {
    console.log('can confirm');
  }

  private isChapterSelected(chapter): boolean {
    let selected = true;
    for (let i = 0; i < chapter.level; i++) {
      if (this.currentIndex[i] !== chapter.index[i] || this.currentIndex[i] === 0) {
        selected = false;
      }
    }
    return selected;
  }

  private isParentChapterSelected(chapter): boolean {
    let selected = true;
    for (let i = 0; i < chapter.level - 1; i++) {
      if (this.currentIndex[i] !== chapter.index[i]) {
        selected = false;
      }
    }
    return selected;
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
      this.isLoading = true;
      zip(
        this.readnListenService.fetchBook(this.bookId, this.bookType),
        this.readnListenService.fetchUserBook(this.userLanCode, this.bookId, false),
        this.readnListenService.fetchChapterHeaders(this.bookId, this.bookType)
      )
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(res => {
        this.book = res[0];
        this.userBook = res[1];
        this.processChapters(res[2]);
        this.loadSessionsTranslations();
      });
    } else {
      this.msg = this.text['InvalidBookId'];
    }
  }

  private loadSessionsTranslations() {
    zip(
      this.revisionService.fetchTranslations(this.bookId, this.book.lanCode, this.userLanCode),
      this.revisionService.fetchSessionData(this.bookId, this.bookType, this.userLanCode)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(res => {
      this.translations = res[0];
      this.mergeSessions(res[1]);
      this.loadChapters();
    });
  }

  private mergeSessions(sessionData: SessionData[]) {
    // merge all answers per repeat
    const repeatCount = this.getRepeatCount(this.userBook);
    let sessions: SessionData[];
    this.answers = [];
    for (let i = 0; i <= repeatCount; i++) {
      sessions = sessionData.filter(s => (s.repeatCount || 0) === i);
      this.answers[i] = '';
      sessions.forEach(s => {
        this.answers[i] += s.answers;
      });
    }
  }

  private getRepeatCount(userBook: UserBook): number {
    if (userBook) {
      return userBook.repeatCount || 0
    } else {
      return 0;
    }
  }

  private loadChapters() {
    if (this.isBookRead(this.userBook)) {
      // If only one chapter, load data for this chapter, otherwise display chapters
      if (this.chapters.length === 0) {
        this.msg = this.text['NoChapter'];
      }
      if (this.chapters.length === 1) {
        this.getCurrentChapter(this.chapters[0]._id, null, true);
      }
      if (this.chapters.length > 1) {
        this.hasChapters = true;
      }
    } else {
      this.msg = this.text['BookNotReadYet'];
    }
  }

  private processChapters(chapters: Chapter[]) {
    // Sort chapters by sequence
    chapters.sort((a, b) => a.sequence > b.sequence ? 1 : b.sequence > a.sequence ? -1 : 0);
    // Merge chapters for which there is no title
    let previousChapter;
    chapters.forEach((chapter, i) => {
      if (chapter.title.trim() === '' && previousChapter) {
        if (previousChapter.merged) {
          previousChapter.merged.push(chapter._id);
        } else {
          previousChapter.merged = [chapter._id]
        }
        previousChapter.nrOfSentences += chapter.nrOfSentences;
        chapter.toRemove = true;
      }
      if (chapter.title.trim() !== '') {
        previousChapter = chapter;
      }
    });
    // Remove chapters with no title
    chapters = chapters.filter(chapter => !chapter.toRemove);
    // Assign index nr
    const indexArr = [0, 0, 0, 0, 0];
    let currentLevel = 1;
    chapters.forEach(chapter => {
      if (chapter.level === currentLevel) {
        indexArr[currentLevel - 1]++;
      } else if (chapter.level > currentLevel) {
        indexArr[currentLevel]++;
      } else if (chapter.level < currentLevel) {
        indexArr[currentLevel - 2]++;
        for (let l = currentLevel - 1; l < 6; l++) {
          indexArr[l] = 0;
        }
      }
      currentLevel = chapter.level;
      chapter.index = indexArr.filter(i => i !== 0);
      chapter.indexLabel = chapter.index.join('.');
    });

    this.chapters = chapters;
  }

  private isBookRead(userBook: UserBook): boolean {
    let isBookRead = false;
    if (userBook && (userBook.repeatCount > 0 || (userBook.bookmark && userBook.bookmark.isBookRead))) {
      isBookRead = true;
    }
    return isBookRead;
  }

  private getCurrentChapter(chapterId: string, merged: string[], singleChapter: boolean) {
    this.currentChapterId = chapterId;
    this.readnListenService.fetchChapter(this.bookId, this.bookType, chapterId, 0)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      chapter => {
        if (merged && merged.length) {
          this.getMergedChapter(chapter, merged);
        } else {
          this.chapterData = this.processChapter(chapter);
        }
      }
    );
  }

  private getMergedChapter(chapter: Chapter, merged: string[]) {
    const chapterId = merged[0];
    this.readnListenService.fetchChapter(this.bookId, this.bookType, chapterId, 0)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      toMergeChapter => {
        chapter.sentences = chapter.sentences.concat(toMergeChapter.sentences);
        chapter.nrOfSentences = chapter.sentences.length;
        merged.shift();
        if (merged.length) {
          this.getMergedChapter(chapter, merged);
        } else {
          this.chapterData = this.processChapter(chapter);
        }
      }
    );
  }

  private processChapter(chapter: Chapter): SentenceData[][] {
    const chapterData = [];
    let parNr = 0;
    chapterData[parNr] = [];
    // Match each sentence with translation and session data
    this.currentChapterTitle = chapter.title;
    let sentenceData: SentenceData;
    chapter.sentences.forEach((sentence: Sentence, i: number) => {
      sentenceData = {
        sentence,
        sentenceId: i.toString(),
        answers: this.getAnswers(i),
        lastAnswer: '',
        translations: this.getTranslations(sentence.text),
        bestTranslation: null
      };
      if (sentenceData.answers.length) {
        sentenceData.lastAnswer = sentenceData.answers.substr(sentenceData.answers.length - 1, 1);
      }
      if (sentenceData.translations.length) {
        sentenceData.bestTranslation = sentenceData.translations[0];
      }
      chapterData[parNr].push(sentenceData);
      if (sentenceData.sentence.isNewParagraph) {
        parNr++;
        chapterData[parNr] = [];
      }
    });
    return chapterData;
  }

  private getAnswers(i: number): string {
    // Find all answers for sentence nr i
    // Only for stories with 1 single chapter !!
    let answers = '';
    this.answers.forEach(a => {
      answers += a[i] || '';
    });
    return answers;
  }

  private getTranslations(sentence: string): SentenceTranslation[] {
    const translationData = this.translations.find(t => t.sentence === sentence),
          translations = translationData ? translationData.translations : [];
    if (translations.length > 1) {
      translations.sort((a, b) => a.score > b.score ? -1 : b.score > a.score ? 1 : 0);
    }
    return translations;
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
