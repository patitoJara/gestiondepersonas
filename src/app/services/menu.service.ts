import { Injectable } from '@angular/core';

export interface MenuItem {
  title: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  /** Retorna el menú dinámico según el rol del usuario */
  getMenuByRole(role: string): MenuItem[] {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return this.adminMenu();
      case 'ADMINISTRATIVO':
        return this.administrativoMenu();
      case 'SUPERVISOR':
        return this.supervisorMenu();
      default:
        return this.defaultMenu();
    }
  }

  private adminMenu(): MenuItem[] {
    return [
      { title: 'Inicio', icon: 'home', route: '/inicio' },
      { title: 'Registro de Demanda', icon: 'assignment_add', route: '/demand' },
      {
        title: 'Mantenedor',
        icon: 'build',
        children: [
          { title: 'Usuarios', icon: 'people_alt', route: '/user' },
          { title: 'Comunas', icon: 'maps_home_work', route: '/commune' },
          { title: 'Tipos de Contacto', icon: 'category', route: '/typecontact' },
          { title: 'Quien Deriva', icon: 'person', route: '/diverter' },
          { title: 'Quien Solicita', icon: 'person', route: '/senders' },
          { title: 'Programas', icon: 'assignment', route: '/program' },
          { title: 'Roles', icon: 'supervisor_account', route: '/roles' },
          { title: 'Sustancias', icon: 'medication', route: '/substances' },
          { title: 'Género', icon: 'wc', route: '/sexs' },
        ],
      },
      { title: 'Acerca de', icon: 'info', route: '/about' },
    ];
  }

  private administrativoMenu(): MenuItem[] {
    return [
      { title: 'Inicio', icon: 'home', route: '/inicio' },
      { title: 'Registro de Demanda', icon: 'assignment_add', route: '/demand' },
    ];
  }

  private supervisorMenu(): MenuItem[] {
    return [
      { title: 'Inicio', icon: 'home', route: '/inicio' },
      { title: 'Planilla de Demanda', icon: 'table_chart', route: '/demand-report' }, // futura
    ];
  }

  private defaultMenu(): MenuItem[] {
    return [{ title: 'Inicio', icon: 'home', route: '/inicio' }];
  }
}
