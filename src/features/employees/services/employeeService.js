import api from '../../../utils/api';

export const employeeService = {
  // Obtiene el listado completo de usuarios/empleados desde la base de datos
  getEmployees: async () => {
    const res = await api.get('/usuarios');
    return res.data;
  },

  // Alterna o actualiza el estado de un empleado (activo / inactivo)
  updateEmployeeStatus: async (id, estado) => {
    const res = await api.patch(`/usuarios/${id}/estado`, { estado });
    return res.data;
  },

  // Elimina un empleado de la base de datos (Permiso total del Administrador)
  deleteEmployee: async (id) => {
    const res = await api.delete(`/usuarios/${id}`);
    return res.data;
  }
};
