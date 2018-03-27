import {Component, Input} from '@angular/core';

@Component({
  selector: 'km-signup',
  template: `
    <a routerLink="/auth/signup" [queryParams]="{courseId: courseId}">
      {{text["SignupAction"]}}
    </a> {{text["ToSeeResults"]}}
  `
})

export class LearnSignUpComponent {
  @Input() text: Object;
  @Input() courseId: string;
}