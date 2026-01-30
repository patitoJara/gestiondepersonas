import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private readonly _loading = new BehaviorSubject<boolean>(false);
  readonly loading$ = this._loading
    .asObservable()
    .pipe(distinctUntilChanged());

  show(): void {
    Promise.resolve().then(() => this._loading.next(true));
  }

  hide(): void {
    Promise.resolve().then(() => this._loading.next(false));
  }
}