import { NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { MaterialsModule } from '../materials/materials.module';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, MaterialsModule, NgTemplateOutlet],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, AfterViewInit {
  constructor(private _dialog: MatDialog) {
    this.People.Initialize();
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const _tyler = this.People.List.find(
      (person) => person.Name.toUpperCase() === 'TYLER'
    );
    this.People.Selected.Execute(_tyler);
    this.Timer.Launch(_tyler);
  }

  @ViewChild('AddPersonTemplate', { static: true })
  add_person_ref!: TemplateRef<any>;

  People = {
    List: <Person[]>[],
    Initialize: () => {
      let ls_people = localStorage.getItem(LS_Key.People);
      if (!!ls_people) {
        this.People.List = JSON.parse(ls_people) as Person[];
        return;
      }
      this.People.List = [];
      this.People.Set_Storage();
    },
    Set_Storage: () => {
      localStorage.setItem(LS_Key.People, JSON.stringify(this.People.List));
    },
    Add_Person: {
      Name: <string>'',
      Execute: async () => {
        const save = await firstValueFrom<boolean>(
          this._dialog
            .open(this.add_person_ref, { disableClose: true })
            .afterClosed()
        );
        if (
          !!save &&
          this.People.List.findIndex(
            (person) => person.Name === this.People.Add_Person.Name
          ) === -1
        ) {
          this.People.List.push({
            Name: this.People.Add_Person.Name,
            Minutes: null,
            Seconds: null,
            Completed: false,
          });
          this.People.Set_Storage();
        }
        this.People.Add_Person.Name = '';
      },
    },
    Remove_Person: (person: Person) => {
      const person_index = this.People.List.findIndex(
        (entry) => entry === person
      );
      if (person_index !== -1) {
        this.People.List.splice(person_index, 1);
        this.People.Set_Storage();
      }
    },
    Selected: {
      Person: <Person>{ Name: null, Minutes: null, Seconds: null },
      Execute: (person: Person) => {
        this.People.Selected.Person = person;
        this.Timer.Set(person.Minutes, person.Seconds);
      },
      Set_Time: (minutes: number, seconds: number) => {
        this.People.Selected.Person.Minutes = minutes;
        this.People.Selected.Person.Seconds = seconds;
        const person_index = this.People.List.findIndex(
          (person) => person.Name === this.People.Selected.Person.Name
        );
        this.People.List[person_index].Minutes = minutes;
        this.People.List[person_index].Seconds = seconds;
        this.People.Set_Storage();
      },
    },
    Reset: () => {
      for (let i = 0; i < this.People.List.length; i++) {
        this.People.List[i].Completed = false;
      }
      this.People.Set_Storage();
    },
  };

  @ViewChild('TimerTemplate', { static: false }) timer_ref: TemplateRef<any>;
  Timer = {
    Code: <[number, number, number, number]>[null, null, null, null],
    //Hours: <number>0,
    Set: (minutes: number, seconds: number) => {
      if (!!minutes) {
        const minute_digits = minutes
          .toString()
          .split('')
          .map((digit) => Number(digit));
        switch (minute_digits.length) {
          case 2:
            this.Timer.Code[0] = minute_digits[0];
            this.Timer.Code[1] = minute_digits[1];
            break;
          case 1:
            this.Timer.Code[1] = minute_digits[0];
            console.log(this.Timer.Code);
            break;
        }
      }
      if (!!seconds) {
        const second_digits = seconds
          .toString()
          .split('')
          .map((digit) => Number(digit));
        switch (second_digits.length) {
          case 2:
            this.Timer.Code[2] = second_digits[0];
            this.Timer.Code[3] = second_digits[1];
            break;
          case 1:
            this.Timer.Code[3] = second_digits[0];
            break;
        }
      }
    },
    Launch: (person: Person) => {
      this.Timer.Set(person.Minutes, person.Seconds);
      console.log(this.Timer.Code);
      this._dialog
        .open(this.timer_ref)
        .afterClosed()
        .subscribe((should_save: boolean) => {
          if (!!should_save) {
            console.log(this.Timer.Code);
            console.log(
              Number(this.Timer.Code.slice(0, 2).join('')),
              Number(this.Timer.Code.slice(2, 4).join(''))
            );
            this.People.Selected.Set_Time(
              Number(this.Timer.Code.slice(0, 2).join('')),
              Number(this.Timer.Code.slice(2, 4).join(''))
            );
          }
          this.Timer.ClearTime();
        });
    },
    AddTime: (digit: number) => {
      const reverse_index = this.Timer.Code.findIndex(
        (str_digit) => !!!str_digit
      );
      if (reverse_index === -1) {
        console.log(this.Timer.Code);
        return;
      }
      this.Timer.Code.shift();
      this.Timer.Code.push(digit);
    },
    ClearTime: () => {
      this.Timer.Code = [null, null, null, null];
    },
    DigitSplit: (
      minutes: number,
      seconds: number
    ): [number, number, number, number] => {
      const digit_array = <[number, number, number, number]>[
        null,
        null,
        null,
        null,
      ];
      const str_minutes = `${minutes}`;
      if (str_minutes.length >= 2) {
        digit_array.splice(
          0,
          2,
          Number(str_minutes[0]),
          Number(str_minutes[1])
        );
      } else {
        digit_array.splice(1, 1, minutes);
      }
      const str_seconds = `${seconds}`;
      if (str_seconds.length >= 2) {
        digit_array.splice(
          2,
          2,
          Number(str_seconds[0]),
          Number(str_seconds[1])
        );
      } else {
        digit_array.splice(3, seconds);
      }
      return digit_array;
    },
  };
}

enum LS_Key {
  People = 'People',
}

interface Person {
  Name: string;
  Minutes: number;
  Seconds: number;
  Completed: boolean;
}
