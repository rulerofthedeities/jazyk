import {Component, Input, Output, EventEmitter} from '@angular/core';
import {File} from '../../models/exercise.model';

@Component({
  selector: 'km-image-list',
  template: `
    <ul class="list-unstyled files">
      <li *ngFor="let image of images; let i=index" (click)="onClick(i)" class="image">
        <img src="{{getImageUrl(image)}}" class="thumb" [class.selected]="image.s3 === selected">
        <span class="marks">
          <span class="fa fa-check" *ngIf="image.s3 === selected"></span>
          <span class="fa fa-times" *ngIf="image.s3 !== selected"></span>
        </span>
      </li>
    </ul>
    <div class="clearfix"></div>
  `,
  styleUrls: ['files.css']
})
export class ImageListComponent {
  @Input() images: File[];
  @Input() selected: string;
  @Output() clickedImage = new EventEmitter<number>();

  onClick(i) {
    this.clickedImage.emit(i);
  }

  getImageUrl(file: File) {
    return file.s3;
  }
}
