import {Exercise, ExerciseData, Points, TimeCutoffs} from '../models/exercise.model';

export class PreviewService {
  buildForeignData(exerciseData: ExerciseData, text: Object, exercise: Exercise) {
    const annotations: string[] = [];
    let suffix = '',
        genus = '';
    // Annotations
    if (exercise.foreign.annotations) {
      const annotationArr = exercise.foreign.annotations.split('|');
      annotationArr.forEach(annotation => annotations.push(annotation));
    }
    // genus
    if (exercise.genus) {
      genus = '(' + exercise.genus.toLowerCase() + ')';
    }
    // suffix
    if (exercise.followingCase) {
      suffix = text['case' + exercise.followingCase];
      if (suffix) {
        suffix = '(+' + suffix.slice(0, 1).toUpperCase() + ')';
      }
    }
    exerciseData.data.annotations = annotations;
    exerciseData.data.hint = exercise.foreign.hint;
    exerciseData.data.genus = genus;
    exerciseData.data.suffix = suffix;
    exerciseData.data.points = this.setDefaultPoints();
  }

  buildLocalData(exerciseData: ExerciseData, text: Object, exercise: Exercise) {
    const annotations: string[] = [];
    // Annotations
    if (exercise.local.annotations) {
      const annotationArr = exercise.local.annotations.split('|');
      annotationArr.forEach(annotation => annotations.push(annotation));
    }
    exerciseData.data.annotations = annotations;
    exerciseData.data.hint = exercise.local.hint;
    exerciseData.data.points = this.setDefaultPoints();
  }

  setDefaultPoints(): Points {
    return {
      base: 0,
      length: 0,
      age: 0,
      time: 0,
      streak: 0,
      new: 0,
      correct: 0,
      fixed: function(): number {
        return this.base + this.length + this.age;
      },
      bonus: function(): number {
        return this.time + this.streak + this.new + this.correct;
      },
      totalmincorrect: function(): number {
        return this.fixed() + this.time + this.streak + this.new;
      },
      total: function(): number {
        return this.fixed() + this.bonus();
      }
    };
  }

  // https://gist.github.com/IceCreamYou/8396172
  getDamerauLevenshteinDistance(source: string, target: string): number {
    if (!source) {
      return target ? target.length : 0;
    } else if (!target) {
      return source.length;
    }

    const sourceLength = source.length,
          targetLength = target.length,
          INF = sourceLength + targetLength,
          score = new Array(sourceLength + 2),
          sd = {};
    let DB: number;

    for (let i = 0; i < sourceLength + 2; i++) {
      score[i] = new Array(targetLength + 2);
    }
    score[0][0] = INF;
    for (let i = 0; i <= sourceLength; i++) {
      score[i + 1][1] = i;
      score[i + 1][0] = INF;
      sd[source[i]] = 0;
    }
    for (let j = 0; j <= targetLength; j++) {
      score[1][j + 1] = j;
      score[0][j + 1] = INF;
      sd[target[j]] = 0;
    }
    for (let i = 1; i <= sourceLength; i++) {
      DB = 0;
      for (let j = 1; j <= targetLength; j++) {
        const i1 = sd[target[j - 1]],
              j1 = DB;
        if (source[i - 1] === target[j - 1]) {
          score[i + 1][j + 1] = score[i][j];
          DB = j;
        } else {
          score[i + 1][j + 1] = Math.min(score[i][j], Math.min(score[i + 1][j], score[i][j + 1])) + 1;
        }
        score[i + 1][j + 1] = Math.min(score[i + 1][j + 1], score[i1] ? score[i1][j1] + (i - i1 - 1) + 1 + (j - j1 - 1) : Infinity);
      }
      sd[source[i - 1]] = i;
    }
    return score[sourceLength + 1][targetLength + 1];
  }

  // https://basarat.gitbooks.io/algorithms/content/docs/shuffling.html
  shuffle<T>(array: T[]): T[] {
    // if it's 1 or 0 items, just return
    if (!array || array.length <= 1) {
      return array;
    }
    // For each index in array
    for (let i = 0; i < array.length; i++) {
      // choose a random not-yet-placed item to place there
      // must be an item AFTER the current item, because the stuff
      // before has all already been placed
      const randomChoiceIndex = this.getRandom(i, array.length - 1);
      // place the random choice in the spot by swapping
      [array[i], array[randomChoiceIndex]] = [array[randomChoiceIndex], array[i]];
    }

    return array;
  }

  loadAudioButtonScript() {
    // for user generated audio buttons
    const body = <HTMLDivElement>document.body,
          script = document.createElement('script');
    script.innerHTML = `
    function play(button, audioId) {
      var audio = document.getElementById('audio' + audioId);
      if (audio) {
        audio.play();
        audio.onplaying = function() {
          button.classList.add('fa-pause-circle');
        };
        audio.onended = function() {
          button.classList.remove('fa-pause-circle');
        };
      }
    }`;
    body.appendChild(script);
  }

  private getRandom(floor: number, ceiling: number) {
    return Math.floor(Math.random() * (ceiling - floor + 1)) + floor;
  }
}
