import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {MarkdownService} from 'angular2-markdown';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import 'rxjs/add/operator/takeWhile';

interface Map<T> {
    [K: string]: T;
}

@Component({
  selector: 'km-build-lesson-intro',
  templateUrl: 'lesson-intro.component.html',
  styleUrls: ['lesson-intro.component.css', '../markdown.css']
})

export class BuildLessonIntroComponent implements OnInit, OnDestroy {
  @Input() lessonId: string;
  @Input() text: Object;
  private componentActive = true;
  private templates: Map<string> = {};
  dropdowns: Map<boolean> = {};
  modified = false;
  intro = '';

  constructor(
    private buildService: BuildService,
    private errorService: ErrorService,
    private markdown: MarkdownService
  ) {}

  ngOnInit() {
    this.loadIntro();
    this.customizeMarkdown();
    this.createTemplates();
  }

  onSaveIntro() {
    if (this.modified) {
      this.saveIntro();
    }
  }

  onChangedIntro() {
    this.modified = true;
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
       const left = this.intro.slice(0, pos);
       if (pos < this.intro.length) {
         right = this.intro.slice(pos - this.intro.length);
       }
       this.intro = left + toInsert + right;
    } else {
      this.intro += toInsert;
    }
    this.closeDropdowns(null);
    this.modified = true;
  }

  private loadIntro() {
    this.buildService
    .fetchIntro(this.lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      data => this.intro = data.intro,
      error => this.errorService.handleError(error)
    );
  }

  private saveIntro() {
    this.buildService
    .updateIntro(this.lessonId, this.intro)
    .takeWhile(() => this.componentActive)
    .subscribe(
      intro => this.modified = false,
      error => this.errorService.handleError(error)
    );
  }

  private customizeMarkdown() {
    this.markdown.renderer.table = (header: string, body: string) => {
      return `
        <table class="mdtable">
          <thead>
            ${header}
          </thead>
          <tbody>
            ${body}
          </tbody>
        </table>
      `;
    };
    this.markdown.renderer.blockquote = (quote: string) => {
      return `<blockquote class="mdquote">${quote}</blockquote>`;
    };
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
    this.templates['olist'] = `1. List item 1
2. List item 2
3. List item 3`;
    this.templates['ulist'] = `* List item 1
* List item 2
* List item 3`;
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
