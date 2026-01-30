import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import { Task } from '../models/Task';
import {User} from '../models/user';
import {Page} from './Page';

@Injectable({
  providedIn: 'root'
})
export class TasksService {

  //private url="http://localhost:8080/api/v1/tasks";
  private url="https://192.168.0.233/api/v1/tasks";
  constructor(private http: HttpClient) { }

  list(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.url}`);
  }

  save(task:Task):Observable<Task>{
    return this.http.post<Task>(`${this.url}`,task);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  findById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.url}/${id}`);
  }

  update(id: number, task:Task):Observable<Task>{
    return this.http.put<Task>(`${this.url}/${id}`, task);
  }

  findByNameContainingIgnoreCase(name: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.url}/findByNameContainingIgnoreCase?name=${name}`);
  }

  listPage(page = 0, size = 10) {
    return this.http.get<Page<Task>>(`${this.url}/listPage?page=${page}&size=${size}`);
  }

  search(name: string, page = 0, size = 10) {
    return this.http.get<Page<Task>>(
      `${this.url}/search?name=${encodeURIComponent(name)}&page=${page}&size=${size}`);
  }

}
