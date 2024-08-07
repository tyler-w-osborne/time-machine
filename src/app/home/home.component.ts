import { NgTemplateOutlet, UpperCasePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnInit,
  Signal,
  TemplateRef,
  ViewChild,
  WritableSignal,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateTime } from 'luxon';
import { firstValueFrom } from 'rxjs';
import { MaterialsModule } from '../materials/materials.module';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, MaterialsModule, NgTemplateOutlet, UpperCasePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, AfterViewInit {
  constructor(private _dialog: MatDialog, private _snack: MatSnackBar) {
    this.People.Initialize();
    this.Microwave.StartTime.Initialize();
  }

  ngOnInit(): void {
    this.Configuration.Initialize();
  }

  ngAfterViewInit(): void {
    // const _tyler = this.People.List.find(
    //   (person) => person.Name.toUpperCase() === 'TYLER'
    // );
    // this.People.Selected.Execute(_tyler);
    // this.Timer.Launch(_tyler);
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
      localStorage.setItem(
        LS_Key.People,
        JSON.stringify(
          this.People.List.map((person) => {
            person.Checked = [];
            return person;
          })
        )
      );
    },
    Add_Person: {
      DialogRef: <MatDialogRef<any, boolean>>null,
      Name: <string>'',
      Execute: async () => {
        this.People.Add_Person.DialogRef = this._dialog.open(
          this.add_person_ref,
          { disableClose: true }
        );
        const save = await firstValueFrom(
          this.People.Add_Person.DialogRef.afterClosed()
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
            Completed: Completion.NA,
            Checked: [],
          });
          this.People.Set_Storage();
        }
        this.People.Add_Person.Name = '';
      },
      Close: (save: boolean) => {
        this.People.Add_Person.DialogRef.close(save);
      },
    },
    Remove_Person: (person: Person) => {
      const person_index = this.People.List.findIndex(
        (entry) => entry === person
      );
      if (person_index !== -1) {
        this.People.List.splice(person_index, 1);
        this.People.Set_Storage();
        new Audio('../assets/sounds/dumpster.ogg').play();
      }
    },
    Selected: {
      Person: <Person>{ Name: null, Minutes: null, Seconds: null },
      Execute: (person: Person) => {
        console.log(person);
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
        this.People.List[i].Completed = Completion.NA;
        this.People.List[i].Checked = [];
      }
      this.People.Set_Storage();
    },
  };

  @ViewChild('TimerTemplate', { static: false }) timer_ref: TemplateRef<any>;
  Timer = {
    Code: <[number, number, number, number]>[null, null, null, null],
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
            break;
        }
      }
      if (!!seconds) {
        const second_digits = seconds
          .toString()
          .split('')
          .map((digit) => Number(digit));
        console.log(second_digits);
        switch (second_digits.length) {
          case 2:
            this.Timer.Code[2] = second_digits[0];
            this.Timer.Code[3] = second_digits[1];
            break;
          case 1:
            this.Timer.Code[2] = 0;
            this.Timer.Code[3] = second_digits[0];
            break;
        }
      } else {
        this.Timer.Code[2] = 0;
        this.Timer.Code[3] = 0;
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
              Number(
                this.Timer.Code.slice(0, 2)
                  .filter((digit) => !!digit)
                  .join('')
              ),
              Number(
                this.Timer.Code.slice(2, 4)
                  .filter((digit) => !!digit)
                  .join('')
              )
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
  };

  Actions = {
    Skip: (person: Person) => {
      person.Completed = Completion.Skipped;
      const person_index = this.People.List.findIndex(
        (person_entry) => person_entry.Name === person.Name
      );
      if (person_index !== -1) {
        this.People.List[person_index].Completed = Completion.Skipped;
        this.People.List[person_index].Checked = [];
        this.People.Set_Storage();
      }
      this.Microwave.List.splice(
        this.Microwave.List.findIndex((entry) => entry.Name === person.Name),
        1
      );
      if (this.Microwave.List.length === 0) {
        this.Configuration.CookStatus = CookStatus.Completed;
        this.Configuration.Set_Storage('Actions-Skip');
      }
      this.Microwave.StartTime.Initialize();
      this.Configuration.Sound.Unset();
      console.log(person);
    },
    Start: (person: Person) => {
      this._dialog.closeAll();
      if (this.Microwave.Sabotage.Vent || this.Microwave.Sabotage.Interior) {
        this.Microwave.List.push(...this.Microwave.List.splice(0, 1));
        this._snack.open(
          `${
            !!this.Microwave.Sabotage.Vent
              ? 'There was too much debris in the vent...'
              : ''
          } ${
            !!this.Microwave.Sabotage.Interior
              ? 'A fork was left in the microwave...'
              : ''
          }`,
          'OK',
          { duration: 3000 }
        );
        this.Configuration.Sound.Set('assets/sounds/boom.mp3');
        this.Microwave.Sabotage.Vent = false;
        this.Microwave.Sabotage.Interior = false;
        return;
      }
      if (!!!person) {
        person = this.Microwave.List[0];
      }
      person.Completed = Completion.InProgress;
      this.Microwave.List[0].Completed = Completion.InProgress;
      this.People.Set_Storage();
      this.Configuration.Sound.Set('assets/sounds/radiation_whir.ogg');
    },
    Complete: (person: Person) => {
      person.Completed = Completion.Completed;
      const person_index = this.Microwave.List.findIndex(
        (person_entry) => person_entry.Name === person.Name
      );
      if (person_index !== -1) {
        this.Microwave.List.splice(person_index, 1);
      }
      if (this.Microwave.List.length === 0) {
        this.Configuration.CookStatus = CookStatus.Completed;
      }
      if (this.Microwave.Sabotage.Reminders.includes(Sabotage.Vent)) {
        this.Microwave.Sabotage.Reminders.splice(
          this.Microwave.Sabotage.Reminders.findIndex(
            (reminder) => reminder === Sabotage.Vent
          ),
          1
        );
        this.Microwave.Sabotage.Vent = true;
      }

      if (this.Microwave.Sabotage.Reminders.includes(Sabotage.Interior)) {
        this.Microwave.Sabotage.Reminders.splice(
          this.Microwave.Sabotage.Reminders.findIndex(
            (reminder) => reminder === Sabotage.Interior
          ),
          1
        );
        this.Microwave.Sabotage.Interior = true;
      }
      const person_entry_index = this.People.List.findIndex(
        (people_entry) => people_entry.Name === person.Name
      );
      this.People.List[person_entry_index].Completed = Completion.Completed;
      this.People.List[person_entry_index].Checked = [];
      this.People.Set_Storage();
      this.Microwave.StartTime.Initialize();
      this.Configuration.Sound.Unset();
      this.Configuration.Set_Storage('Actions-Complete');
    },
  };

  @ViewChild('MicrowaveVentTemplate', { static: true })
  microwave_vent_ref: TemplateRef<any>;
  @ViewChild('MicrowaveInteriorTemplate', { static: true })
  microwave_interior_ref: TemplateRef<any>;

  Microwave = {
    StartTime: {
      Value: <WritableSignal<DateTime>>signal(null),
      Initialize: () => {
        let start_time = DateTime.now().set({
          hour: 12,
          minute: 0,
          second: 0,
        });
        for (let i = 0; i < this.Microwave.List.length; i++) {
          start_time = start_time.minus({
            minutes: this.Microwave.List[i].Minutes,
            seconds: this.Microwave.List[i].Seconds,
          });
        }
        this.Microwave.StartTime.Value.set(start_time);
      },
      ToDigitArray: (): Signal<[number, number, number, number]> => {
        return computed(() => {
          const digit_array = <[number, number, number, number]>[0, 0, 0, 0];
          const hours = `${this.Microwave.StartTime.Value().hour}`
            .split('')
            .map((digit) => Number(digit));
          const minutes = `${this.Microwave.StartTime.Value().minute}`
            .split('')
            .map((digit) => Number(digit));
          digit_array.splice(2 - hours.length, hours.length, ...hours);
          digit_array.splice(4 - minutes.length, minutes.length, ...minutes);
          return digit_array;
        });
      },
    },
    List: <Person[]>[],
    Search: (mouse_event: MouseEvent, menu: 'Vent' | 'Interior') => {
      mouse_event.preventDefault();
      mouse_event.stopPropagation();
      if (
        [CookStatus.Idle, CookStatus.Completed].includes(
          this.Configuration.CookStatus
        )
      ) {
        return;
      }
      let template_ref: TemplateRef<any>;
      switch (menu) {
        case 'Vent':
          template_ref = this.microwave_vent_ref;
          break;
        case 'Interior':
          template_ref = this.microwave_interior_ref;
          break;
      }
      if (!!!template_ref) {
        return;
      }
      this._dialog.open(template_ref, {
        panelClass: 'custom-dialog-action-list',
        position: {
          left: `${mouse_event.clientX}px`,
          top: `${mouse_event.clientY}px`,
        },
        width: '250px',
      });
    },
    Shuffle: () => {
      const person_list = this.People.List.filter((person) =>
        [Completion.NA, Completion.InProgress].includes(person.Completed)
      ).map((person) => person);
      for (let i = person_list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = person_list[i];
        person_list[i] = person_list[j];
        person_list[j] = temp;
      }
      this.Microwave.List = person_list;
      //this.Microwave.Sabotage.Execute(Sabotage.Random);
    },
    Start: () => {
      this.Configuration.CookStatus = CookStatus.Cookin;
      this.Microwave.StartTime.Initialize();
      this.Configuration.Set_Storage('microwave-start');
    },
    Sabotage: {
      Vent: <boolean>false,
      Interior: <boolean>false,
      Reminders: <Sabotage[]>[],
      Execute: (sabotage: Sabotage) => {
        switch (sabotage) {
          case Sabotage.Vent:
            return;
          case Sabotage.Interior:
            return;
          default: {
            // random
            const random_list = [true, false];
            this.Microwave.Sabotage.Vent =
              random_list[Math.floor(Math.random() * random_list.length)];
            this.Microwave.Sabotage.Interior =
              random_list[Math.floor(Math.random() * random_list.length)];
            console.log(this.Microwave.Sabotage);
          }
        }
      },
      Fix: (part: Sabotage) => {
        switch (part) {
          case Sabotage.Vent:
            if (this.Microwave.Sabotage.Vent) {
              this._snack.open(
                `There was a large amount of gas soaked lint in the vent...suspicious`
              );
              this.Microwave.Sabotage.Vent = false;
            }
            break;
          case Sabotage.Interior:
            if (this.Microwave.Sabotage.Interior) {
              this._snack.open(
                `A piece of metal was left in the microwave...what was that to I wonder?`
              );
            }
            this.Microwave.Sabotage.Interior = false;
        }
        this.Microwave.List[0].Checked.push(part);
      },
      ChangeReminders: (part_to_sabotage: Sabotage) => {
        if (this.Microwave.Sabotage.Reminders.includes(part_to_sabotage)) {
          this.Microwave.Sabotage.Reminders.splice(
            this.Microwave.Sabotage.Reminders.findIndex(
              (reminder) => reminder === part_to_sabotage
            ),
            1
          );
          console.log(this.Microwave.Sabotage.Reminders);
          return;
        }
        this.Microwave.Sabotage.Reminders.push(part_to_sabotage);
        console.log(this.Microwave.Sabotage.Reminders);
      },
    },
    Reset: () => {
      this.Configuration.CookStatus = CookStatus.Idle;
      this.Microwave.List = [];
      this.Configuration.Set_Storage('Microwave-Reset');
      this.Microwave.StartTime.Initialize();
    },
  };

  SVG = {
    Outline: `
      M0,200
      L500,200
      L500,500
      L0,500
      L0,0
    `,
    MainPanel: [
      `
      M0,250
      L400,250
      L400,500
      L50,500
      Q0,500 0,450
      L0,250
      `,
      `
      M27.5,277.5
      L372.5,277.5
      L372.5,472.5
      L27.5,472.5
      L27.5,277.5
      `,
      // `
      // M35,285
      // L365,285
      // L365,465
      // L35,465
      // L35,285
      // `,
    ],
    KeypadPanel: [
      `M400,250
      L500,250
      L500,450
      Q500,500 450,500
      L400,500
      L400,250`,
    ],
    Top: [
      `M50,200
      L450,200 
      C475,200 480,200 500,250
      L0,250
      C25,200 30,200 50,200`,
      `
      M400,210
      L470,210
      L482.5,240
      L410,240
      L400,210

      M410,215
      L417.5,235

      M420,215
      L427.5,235

      M430,215
      L437.5,235

      M440,215
      L447.5,235

      M450,215
      L457.5,235

      M460,215
      L467.5,235
      `,
    ],
  };

  get CompletionEnum(): typeof Completion {
    return Completion;
  }

  CookStatusEnum: typeof CookStatus = CookStatus;

  Parts: typeof Sabotage = Sabotage;

  alert(input: string) {
    alert(input);
  }

  get Traveler_Entries(): Person[] {
    if (this.Configuration.CookStatus === CookStatus.Idle) {
      return this.People.List;
    }
    return this.Microwave.List;
  }

  Configuration = {
    CookStatus: <CookStatus>CookStatus.Idle,
    Initialize: () => {
      const last_configuration_string = localStorage.getItem('Configuration');
      if (!!last_configuration_string) {
        const last_configuration = JSON.parse(last_configuration_string) as {
          Cook_Status: CookStatus;
          Sabotage_Vent: boolean;
          Sabotage_Interior: boolean;
          Cook_Order: Person[];
        };
        if (last_configuration.Cook_Status === CookStatus.Completed) {
          this.Configuration.CookStatus = CookStatus.Idle;
          this.Microwave.Sabotage.Vent = last_configuration.Sabotage_Vent;
          this.Microwave.Sabotage.Interior =
            last_configuration.Sabotage_Interior;
          return;
        } else if (last_configuration.Cook_Status === CookStatus.Cookin) {
          const cook_order = last_configuration.Cook_Order.filter(
            (person_entry) =>
              !!this.People.List.find(
                (person) => person.Name === person_entry.Name
              )
          );
          this.Microwave.List = cook_order;
          this.Microwave.Sabotage.Vent = last_configuration.Sabotage_Vent;
          this.Microwave.Sabotage.Interior =
            last_configuration.Sabotage_Interior;
          this.Microwave.Start();
        }
        this.Configuration.CookStatus = last_configuration.Cook_Status;
        return;
      }
      console.log('Random Sabotage');
      this.Microwave.Sabotage.Execute(Sabotage.Random);
      this.Configuration.Set_Storage('Configuration-Initialization');
    },
    Set_Storage: (from: string) => {
      console.log('Configuration Set From:', from);
      const configuration = {
        Cook_Status: <CookStatus>this.Configuration.CookStatus,
        Sabotage_Vent: <boolean>this.Microwave.Sabotage.Vent,
        Sabotage_Interior: <boolean>this.Microwave.Sabotage.Interior,
        Cook_Order: this.Microwave.List,
      };
      localStorage.setItem('Configuration', JSON.stringify(configuration));
      //localStorage.setItem('Cook_Status', this.Configuration.CookStatus);
    },
    DigitSplit: (
      minutes: number,
      seconds: number
    ): [number, number, number, number] => {
      const digit_array = <[number, number, number, number]>[0, 0, 0, 0];
      const split_minutes = !!minutes
        ? `${minutes}`.split('').map((digit) => Number(digit))
        : [null, null];
      const split_seconds = !!seconds
        ? `${seconds}`.split('').map((digit) => Number(digit))
        : [0, 0];
      digit_array.splice(
        2 - split_minutes.length,
        split_minutes.length,
        ...split_minutes
      );
      digit_array.splice(
        4 - split_seconds.length,
        split_seconds.length,
        ...split_seconds
      );
      return digit_array;
    },
    Sound: {
      CurrentSound: <HTMLAudioElement>null,
      Set: (audio_link: string) => {
        this.Configuration.Sound.Unset();
        this.Configuration.Sound.CurrentSound = new Audio(audio_link);
        this.Configuration.Sound.CurrentSound.play();
      },
      Unset: () => {
        if (!!this.Configuration.Sound.CurrentSound) {
          this.Configuration.Sound.CurrentSound.pause();
          this.Configuration.Sound.CurrentSound = null;
        }
      },
    },
  };
}

enum LS_Key {
  People = 'People',
}

enum Completion {
  NA = 'N/A',
  Skipped = 'Skipped',
  InProgress = 'In Progress',
  Completed = 'Completed',
}

enum CookStatus {
  Idle = 'Idle',
  Cookin = 'Cookin',
  Completed = 'Completed',
}

enum Sabotage {
  Vent = 'Vent',
  Interior = 'Interior',

  Random = 'Random',
}

interface Person {
  Name: string;
  Minutes: number;
  Seconds: number;
  Completed: Completion;
  Checked: Sabotage[];
}
