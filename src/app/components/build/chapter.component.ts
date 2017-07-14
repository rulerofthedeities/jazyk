import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {Lesson} from '../../models/course.model';
import {ModalConfirmComponent} from '../modals/modal-confirm.component';

@Component({
  selector: 'km-chapter',
  templateUrl: 'chapter.component.html',
  styleUrls: ['chapter.component.css']
})
export class BuildChapterComponent {
  @Input() lessons: Lesson[];
  @Input() title: string;
  @Input() total: number;
  @Input() isOpen: boolean;
  @Input() text: Object;
  @Input() nr: number;
  @Output() toggleOpen = new EventEmitter();
  @Output() remove = new EventEmitter();
  @Output() sorted = new EventEmitter();
  private isRemoving = false;

  constructor(
    private router: Router
  ) {}

  onClick(e: any, action: string) {
    event.preventDefault();
    console.log('removelesson');
    switch (action) {
      case 'openchapter':
        this.openChapter();
      break;
      case 'removechapter':
        this.askRemoveChapter(e);
      break;
      case 'editlesson':
        this.editLesson(e);
      break;
    }
  }

  onResorted() {
    console.log('resorted');
    this.sorted.emit();
  }

  getRemoveMessage(tpe): string {
    let msg = '';
    if (this.text['Remove' + tpe]) {
      msg = this.text['Remove' + tpe];
      msg = msg.replace('%s', this.title);
    }
    return msg;
  }


  onRemoveConfirmed(removeOk: boolean) {
    if (removeOk) {
      this.isRemoving = true;
      this.remove.emit(true);
    }
  }

  private openChapter() {
    this.toggleOpen.emit();
  }


  private askRemoveChapter(confirm: ModalConfirmComponent) {
    if (!this.isRemoving) {
      confirm.showModal = true;
    }
  }

  private editLesson(lessonId: string) {
    this.router.navigate(['/build/lesson/' + lessonId]);
  }
}
