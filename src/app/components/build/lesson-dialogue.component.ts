import {Component, Input, ViewChild, OnInit, OnDestroy, AfterViewInit} from '@angular/core';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {PreviewService} from '../../services/preview.service';
import {Dialogue, LanPair} from '../../models/course.model';
import {takeWhile} from 'rxjs/operators';

@Component({
  selector: 'km-build-lesson-dialogue',
  templateUrl: 'lesson-dialogue.component.html',
  styles: [`
    .panel {
      margin: 0 -15px;
    }
  `]
})

export class BuildLessonDialogueComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() languagePair: LanPair;
  @Input() lessonId: string;
  @Input() text: Object;
  @ViewChild('dialogueField') input;
  private componentActive = true;
  modified = false;
  saved = false;
  dialogueTpes = ['Dialogue', 'Story'];
  dialogue: Dialogue;
  dialogueDefault: Dialogue;
  result: Text;
  
  constructor(
    private buildService: BuildService,
    private errorService: ErrorService,
    private previewService: PreviewService
  ) {}

  ngOnInit() {
    this.dialogueDefault = {
      tpe: 'Dialogue',
      text: 'Title|Translated Title',
      local: '',
      foreign: '',
      localTitle: '',
      foreignTitle: ''
    }
    this.dialogue = this.dialogueDefault;
    this.loadDialogue();
    this.parse();
  }

  ngAfterViewInit() {
    this.input.valueChanges
    .debounceTime(400)
    .subscribe(data => {
      this.parse();
    });
  }

  onChangedDialogue() {
    this.modified = true;
    this.saved = false;
    this.parse();
  }

  onSaveDialogue() {
    if (this.modified) {
      this.saveDialogue();
    }
  }

  private loadDialogue() {
    this.buildService
    .fetchDialogue(this.lessonId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dialogue => this.dialogue = dialogue ? dialogue : this.dialogueDefault,
      error => this.errorService.handleError(error)
    );
  }

  private saveDialogue() {
    this.parse();
    this.buildService
    .updateDialogue(this.lessonId, this.dialogue)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      update => {
        this.modified = false,
        this.saved = true},
      error => this.errorService.handleError(error)
    );
  }

  private parse() {
    // remove tags
    const tags = ['a', 'img', 'span', 'div', 'audio'],
          text = this.previewService.removeTags(this.dialogue.text, tags),
          splitter = this.dialogue.tpe === 'Dialogue' ? '\n' : ']',
          sourceSentences = text.split(splitter);
    this.dialogue.local = '';
    this.dialogue.foreign = '';
    // parse content
    sourceSentences.forEach((sentence, i) => {
      if (sentence) {
        if (this.dialogue.tpe === 'Dialogue') {
          this.parseDialogueSentence(sentence, i);
        } else {
          this.parseTextSentence(sentence, i);
        }
      }
    });
  }

  private parseDialogueSentence(sentence: string, i: number) {
    // Format: [Foreign Name]Foreign text | [Local Name]Local Text
    const snippets = sentence.split('|'),
          lineLocal = snippets[1] || '',
          lineForeign = snippets[0] || '';

    if (i === 0) {
      // First line is the title
      this.dialogue.localTitle = lineLocal.trim();
      this.dialogue.foreignTitle = lineForeign.trim();
    } else {
      this.dialogue.local += this.parseDialogueLine(lineLocal);
      this.dialogue.foreign += this.parseDialogueLine(lineForeign);
    }
  }

  private parseTextSentence(sentence: string, i: number) {
    const lineBreak = sentence[0] === '\n' && i > 1 ? '<br>' : '',
          snippets = sentence.split('['),
          lineLocal = snippets[1] || '',
          lineForeign = snippets[0] || '';

    if (i === 0) {
      // First line is the title
      this.dialogue.localTitle = lineLocal.trim();
      this.dialogue.foreignTitle = lineForeign.trim();
    } else {
      this.dialogue.local += lineBreak + lineLocal + '<hr>';
      this.dialogue.foreign += lineBreak + lineForeign + '<hr>';
    }
  }

  private parseDialogueLine(line: string) {
    const match = line.match(/\[.*\]/);
    let name: string,
        text: string;
    if (match) {
      name = match[0];
      name = `<dt>${name.substr(1, name.length -2)}</dt>`;
      text = `<dd>${line.substring(match.index + match[0].length, line.length)}</dd>`;
    } else {
      name = `<dt></dt>`;
      text = `<dd>${line}</dd>`;
    }
    return name + text + '<hr>';
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
