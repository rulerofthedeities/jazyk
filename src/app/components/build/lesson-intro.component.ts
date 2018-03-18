import {Component, Input, OnInit, OnDestroy, ViewChild, AfterViewInit} from '@angular/core';
import {MarkdownService} from 'ngx-md';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Intro} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

interface Map<T> {
    [K: string]: T;
}

interface Options {
  title?: string;
  format?: string;
  url?: string;
}

@Component({
  selector: 'km-build-lesson-intro',
  templateUrl: 'lesson-intro.component.html',
  styleUrls: ['lesson-intro.component.css', '../markdown.css']
})

export class BuildLessonIntroComponent implements OnInit, OnDestroy {
  @Input() lessonId: string;
  @Input() text: Object;
  @ViewChild('introField') input;
  private componentActive = true;
  private templates: Map<string> = {};
  dropdowns: Map<boolean> = {};
  modified = false;
  saved = false;
  intro: Intro;
  introDefault: Intro;

  constructor(
    private buildService: BuildService,
    private errorService: ErrorService,
    private markdown: MarkdownService
  ) {}

  ngOnInit() {
    this.introDefault = {
      text: '',
      html: ''
    }
    this.intro = this.introDefault;
    this.loadIntro();
    this.createTemplates();
    this.parseText();
  }

  ngAfterViewInit() {
    this.input.valueChanges
    .debounceTime(400)
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

  onInsertTemplate(introField: any, tpe: string, dropdown: string = 'none') {
    const toInsert = '\n' + this.templates[tpe] + '\n';
    const pos: number = introField.selectionStart;
    let right = '';
    if (pos !== undefined) {
       const left = this.intro.text.slice(0, pos);
       if (pos < this.intro.text.length) {
         right = this.intro.text.slice(pos - this.intro.text.length);
       }
       this.intro.text = left + toInsert + right;
    } else {
      this.intro.text += toInsert;
    }
    this.closeDropdowns(null);
    this.modified = true;
  }

  private loadIntro() {
    this.buildService
    .fetchIntro(this.lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      intro => this.intro = intro ? intro : this.introDefault,
      error => this.errorService.handleError(error)
    );
  }

  private saveIntro() {
    this.parseText();
    this.buildService
    .updateIntro(this.lessonId, this.intro)
    .takeWhile(() => this.componentActive)
    .subscribe(
      intro => {
        this.modified = false,
        this.saved = true},
      error => this.errorService.handleError(error)
    );
  }

  private parseText() {
    let html = this.intro.text;
    html = this.parseHeaders(html);
    html = this.parseAudio(html);
    this.intro.html = html;
  }

  private parseHeaders(text: string): string {
    // format [h1: title]
    const tag = 'header',
          headerTags = this.getTags('header');
    let headerTitle: string,
        headerHtml: string,
        html = text;
    headerTags.forEach(headerTag => {
        console.log('headertag', headerTag);
      headerTitle = headerTag.trim() || '';
      headerHtml = this.getHtmlSnippet('header', {title: headerTitle});
        console.log('headerhtml', headerHtml);
      html = this.replaceText('header', html, headerTag, headerHtml);
        console.log('html', html);
    });
    return html;
  }

  private parseAudio(text: string): string {
    // format [audio: url, (format, default='ogg')]
    const tag = 'audio',
          audioTags = this.getTags('audio'),
          validFormats = ['ogg', 'mp3', 'mp4'];
    let audioData: Array<string>,
        audioFormat: string,
        audioUrl: string,
        audioHtml: string,
        regex: RegExp,
        html = text;
    audioTags.forEach(audioTag => {
      audioData = audioTag.split(',');
      audioData = audioData.map(data => data.trim());
      audioUrl = audioData[0];
      audioFormat = audioData[1] && validFormats.find(format => format === audioData[1]) ? audioData[1] : 'ogg';
      audioHtml = this.getHtmlSnippet('audio', {url: audioUrl, format: audioFormat});
      html = this.replaceText('audio', html, audioTag, audioHtml);
      // regex = new RegExp('\\[audio:' + audioTag + '\\]', 'ig');
      // html = html.replace(regex, audioHtml);
    });
    return html;
  }

  private getTags(tag: string) {
    const regex = new RegExp(`(?<=\\[${tag}:).*?(?=\\])`, 'ig');
    let result: RegExpExecArray,
        data: Array<string> = [],
        cnt = 0;
    result = regex.exec(this.intro.text);
    while (result && cnt < 100) {
      data.push(result[0]);
      result = regex.exec(this.intro.text);
      cnt++;
    }
    return data;
  }

  private getHtmlSnippet(tpe: string, options: Options) {
    switch (tpe) {
      case 'header': 
        return `<h1>${options.title}</h1>`;
      case 'audio':
        return `<audio controls>
          <source src="${options.url}" type="audio/${options.format}">
        </audio>`;
    }
  }

  private replaceText(tpe: string, html: string, oldText: string, newText: string): string {
    const regex = new RegExp(`\\[${tpe}:${oldText}\\]`, 'ig');
    return html.replace(regex, newText);
  }

  private closeDropdowns(keepOpen: string) {
    const dropdowns: Array<string> = ['list', 'header', 'other'];
    dropdowns.forEach(dropdown => {
      if (dropdown !== keepOpen) {
        this.dropdowns[dropdown] = false;
      }
    });
  }

  private createTemplates() {
    this.templates['table'] = `| Col1     |      Col2     |  Cool |
|----------|:-------------:|------:|
| col 1 is |  left-aligned | €1000 |
| col 2 is |    centered   |   €90 |
| col 3 is | right-aligned |    €5 |`;
    this.templates['olist'] = `1. List item 1\n2. List item 2\n3. List item 3`;
    this.templates['ulist'] = `* List item 1\n* List item 2\n* List item 3`;
    this.templates['header1'] = `# title`;
    this.templates['header2'] = `## title`;
    this.templates['header3'] = `### title`;
    this.templates['quote'] = `> This is a blockquote.`;
    this.templates['bold'] = `**this text is bold**`;
    this.templates['rule'] = `---`;
    this.templates['space'] = `<br>`;
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
