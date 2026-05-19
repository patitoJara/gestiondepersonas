import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface VpnConfig {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class VpnService {

  private api = `${environment.apiUrl}/vpn`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las configuraciones VPN
   */
  getAll(): Observable<VpnConfig[]> {
    return this.http.get<VpnConfig[]>(this.api);
  }

  /**
   * Obtener una configuración VPN por id
   */
  getById(id: number): Observable<VpnConfig> {
    return this.http.get<VpnConfig>(`${this.api}/${id}`);
  }

  /**
   * Crear configuración VPN
   */
  create(data: Partial<VpnConfig>): Observable<VpnConfig> {
    return this.http.post<VpnConfig>(this.api, data);
  }

  /**
   * Actualizar configuración VPN
   */
  update(id: number, data: Partial<VpnConfig>): Observable<VpnConfig> {
    return this.http.put<VpnConfig>(`${this.api}/${id}`, data);
  }

  /**
   * Eliminar configuración VPN
   */
  delete(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

}