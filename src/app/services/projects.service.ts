import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Project} from '../models/Project';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  private url="http://localhost:8080/api/v1/projects";
  constructor(private http: HttpClient) { }

  list(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.url}`);
  }

  save(project:Project):Observable<Project>{
    return this.http.post<Project>(`${this.url}`,project);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  findById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.url}/${id}`);
  }

  update(id: number, project:Project):Observable<Project>{
    return this.http.put<Project>(`${this.url}/${id}`, project);
  }

  findByNameContainingIgnoreCase(name: string): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.url}/findByNameContainingIgnoreCase?name=${name}`);
  }
}
