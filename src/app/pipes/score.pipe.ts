import { Pipe, PipeTransform } from '@angular/core';
/*
 * Formats score with spaces for 1000s
*/
@Pipe({name: 'score'})
export class ScorePipe implements PipeTransform {

  transform(score: number): string {
    if (score) {
      return score.toLocaleString('en').replace(/,/g, ' ');
    } else {
      return '0';
    }
  }
}
