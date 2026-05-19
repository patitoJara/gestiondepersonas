import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GroupReportService {

  generateGroupReport(payload: {
    titulo: string;
    data: any[];
  }): string {

    const now = new Date();
    const fechaImp = now.toLocaleDateString('es-CL');
    const horaImp = now.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const { titulo, data } = payload;

    const logoUrl = `${window.location.origin}/assets/logoSSM.png`;

    // 🔥 DETECCIÓN DINÁMICA
    const includeRoles = data.some((d: any) => d.roles);
    const includeGrupo = data.some((d: any) => d.grupo);
    const includeJefatura = data.some((d: any) => d.jefatura);

    const colSpan =
      3 +
      (includeRoles ? 1 : 0) +
      (includeGrupo ? 1 : 0) +
      (includeJefatura ? 1 : 0);

    const rows = data.map((d: any) => `
      <tr>
        <td>${d.nombre}</td>
        <td>${d.rut}</td>
        <td>${d.email}</td>
        ${includeRoles ? `<td>${d.roles}</td>` : ''}
        ${includeGrupo ? `<td>${d.grupo}</td>` : ''}
        ${includeJefatura ? `<td>${d.jefatura}</td>` : ''}
      </tr>
    `).join('');

    return `
      <table>

        <thead>

          <!-- 🔵 HEADER -->
          <tr>
            <td colspan="${colSpan}" style="border:none;">

              <div style="display:flex; align-items:center; gap:8px;">
                <img src="${logoUrl}" style="height:68px;" />

                <div style="font-size:12px; line-height:1.2;">
                  <strong>Servicio de Salud Magallanes</strong><br>
                  Sistema de Gestión de Usuarios
                </div>
              </div>

              <h3 style="
                text-align:center;
                color:#1565c0;
                border-top:1px solid #1565c0;
                border-bottom:1px solid #1565c0;
                padding:4px;
                margin:6px 0;
                font-size:14px;
                font-weight:600;
              ">
                ${titulo}
              </h3>

            </td>
          </tr>

          <!-- 🔵 COLUMNAS -->
          <tr>
            <th>Nombre</th>
            <th>RUT</th>
            <th>Email</th>
            ${includeRoles ? `<th>Roles</th>` : ''}
            ${includeGrupo ? `<th>Grupo</th>` : ''}
            ${includeJefatura ? `<th>Jefatura</th>` : ''}
          </tr>

        </thead>

        <tbody>
          ${rows}
        </tbody>

      </table>

      <!-- 🔵 FOOTER -->
      <div style="
        margin-top: 10px;
        font-size: 10px;
        text-align: right;
        color: #555;
      ">
        Impreso el ${fechaImp} a las ${horaImp}
      </div>
    `;
  }
}