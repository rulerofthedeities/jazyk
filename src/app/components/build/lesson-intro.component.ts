import {Component, Input, OnInit, OnDestroy, ViewChild, AfterViewInit,
  ElementRef, HostListener} from '@angular/core';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {PreviewService} from '../../services/preview.service';
import {UtilsService} from '../../services/utils.service';
import {MarkdownService} from '../../services/markdown.service';
import {Intro, Map} from '../../models/course.model';
import {Alignment, TableOptions, SnippetOptions, ColumnOptions,
        ReplaceOptions, TagOptions} from '../../models/markdown.model';
import {takeWhile, debounceTime} from 'rxjs/operators';

@Component({
  selector: 'km-build-lesson-intro',
  templateUrl: 'lesson-intro.component.html',
  styleUrls: ['lesson-intro.component.css']
})

export class BuildLessonIntroComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() lessonId: string;
  @Input() text: Object;
  private componentActive = true;
  private templates: Map<string> = {};
  dropdowns: Map<boolean> = {};
  modified = false;
  saved = false;
  intro: Intro;
  introDefault: Intro;
  @ViewChild('introField') introField;
  @ViewChild('insertField') insertField;
  @ViewChild('dropdown') el: ElementRef;
  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (this.el && !this.el.nativeElement.contains(event.target)) {
      // Outside dropdown, close dropdown
      this.closeDropdowns(null);
    }
  }

  constructor(
    private buildService: BuildService,
    private errorService: ErrorService,
    private previewService: PreviewService,
    private utilsService: UtilsService,
    private markdownService: MarkdownService
  ) {}

  ngOnInit() {
    this.previewService.loadAudioButtonScript();
    this.introDefault = {
      text: '',
      html: ''
    };
    this.intro = this.introDefault;
    this.loadIntro();
    this.templates = this.markdownService.getTemplates();
    this.parseText();
  }

  ngAfterViewInit() {
    this.introField.valueChanges
    .pipe(debounceTime(400))
    .subscribe(data => {
      this.parseText();
    });
  }

  onSaveIntro() {
    if (this.modified) {
      this.saveIntro();
    }
  }

  onChangedIntro() {
    this.modified = true;
    this.saved = false;
  }

  onToggleButton(tpe: string) {
    this.closeDropdowns(tpe);
    this.dropdowns[tpe] = !this.dropdowns[tpe];
  }

  onInsertTemplate(tpe: string, dropdown: string = 'none') {
    const toInsert = this.templates[tpe];
    this.utilsService.insertKey(this.insertField.nativeElement, toInsert);
    this.intro.text = this.insertField.nativeElement.value;
    this.closeDropdowns(null);
    this.modified = true;
  }

  private loadIntro() {
    this.buildService
    .fetchIntro(this.lessonId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      intro => this.intro = intro ? intro : this.introDefault,
      error => this.errorService.handleError(error)
    );
  }

  private saveIntro() {
    this.parseText();
    this.buildService
    .updateIntro(this.lessonId, this.intro)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      intro => {
        this.modified = false;
        this.saved = true;
      },
      error => this.errorService.handleError(error)
    );
  }

  private parseText() {
    const tags = ['span', 'div', 'audio', 'h1', 'h2', 'ul', 'li'];
    let html = this.markdownService.removeTags(this.intro.text, tags);
    html = html.replace(/(?:\r\n|\r|\n)/g, '<br>'); // replace line breaks with <br>
    html = html.replace(/(?:->)/g, '→'); // replace -> with arrow
    html = this.markdownService.parseFontStyles(html, 'b');
    html = this.markdownService.parseFontStyles(html, 'i');
    html = this.markdownService.parseSize(html, 'size');
    html = this.markdownService.parseColor(html, 'color');
    html = this.markdownService.parseTranslation(html, 'tl');
    html = this.markdownService.parseHeaders(html, 'header');
    html = this.markdownService.parseHeaders(html, 'subheader');
    html = this.markdownService.parseHeaders(html, 'subsubheader');
    html = this.markdownService.parseBorders(html, 'border');
    html = this.markdownService.parseTab(html, 'tab');
    html = this.markdownService.parseLists(html);
    html = this.markdownService.parseAudio(html);
    html = this.markdownService.parseTables(html);
    this.intro.html = html;
  }

  private closeDropdowns(keepOpen: string) {
    const dropdowns: Array<string> = ['arrange', 'header', 'size', 'other'];
    dropdowns.forEach(dropdown => {
      if (dropdown !== keepOpen) {
        this.dropdowns[dropdown] = false;
      }
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
