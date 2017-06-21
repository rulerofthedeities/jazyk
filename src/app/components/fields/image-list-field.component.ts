import {Component, Input, Output, EventEmitter} from '@angular/core';
import {File} from '../../models/exercise.model';

@Component({
  selector: 'km-image-list',
  template: `
    <ul class="list-unstyled files">
      <li *ngFor="let image of images; let i=index" (click)="onClick(i)" class="image">
        <img src="{{getImageUrl(image)}}" class="thumb" >
      </li>
    </ul>
    <div class="clearfix"></div>
  `,
  styleUrls: ['files.css']
})
export class ImageListComponent {
  @Input() images: File[];
  @Output() clickedImage = new EventEmitter<number>();

  onClick(i) {
    this.clickedImage.emit(i);
  }

  getImageUrl(file: File) {
    return file.s3;
  }
}
