import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {ModalConfirmComponent} from '../modals/modal-confirm.component';

@Component({
  selector: 'km-chapter',
  templateUrl: 'chapter.component.html',
  styleUrls: ['chapter.component.css']
})
export class BuildChapterComponent {
  @Input() title: string;
  @Input() total: number;
  @Input() chapterTotal: number;
  @Input() isOpen: boolean;
  @Input() text: Object;
  @Input() nr: number;
  @Output() toggleOpen = new EventEmitter();
  @Output() remove = new EventEmitter();
  @Output() sorted = new EventEmitter();
  private isRemoving = false;
  private sortingId: string; // Workaround for sorting bug
  private draggingId: string; // Workaround for sorting bug

  constructor(
    private router: Router
  ) {}

  onClick(event: MouseEvent, e: any, action: string) {
    event.preventDefault();
    switch (action) {
      case 'openchapter':
        this.openChapter();
      break;
      case 'removechapter':
        this.askRemoveChapter(e);
      break;
    }
  }

  onResorted(id: string) {
    this.sortingId = id;
    this.sorted.emit();
  }

  onDraggedStart(id: string) {
    this.draggingId = id;
  }

  onDraggedEnd(id: string) {
    if (this.sortingId !== this.draggingId) {
      this.sorted.emit();
    }
    this.sortingId = null;
    this.draggingId = null;
  }

  getLessonLabel(nr: number): string {
    if (nr === 1) {
      return this.text['lesson'];
    } else {
      return this.text['lessons'];
    }
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
}
