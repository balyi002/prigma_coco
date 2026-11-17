import React, { useEffect, useState, useCallback } from 'react';
import { userService } from '../services/userService';
import { Plus, Search, Trash2, Edit2, X, Users, Shield, Phone, CreditCard } from 'lucide-react';
import ToggleSwitch from '../../../components/ui/ToggleSwitch';

export const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tiposDoc, setTiposDoc] = useState([]);
  const [search, setSearch] = useState('');
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nombre_usuario: '',
    apellido_usuario: '',
    id_tipo_documento: 1,
    documento: '',
    telefono: '',
    contrasena: '',
    id_rol: 2
  });

  const loadData = useCallback(async () => {
    try {
      const [uRes, rRes, tdRes] = await Promise.all([
        userService.getAll(),
        userService.getRoles(),
        userService.getTiposDocumento()
      ]);
      setUsers(Array.isArray(uRes) ? uRes : []);
      setRoles(Array.isArray(rRes) ? rRes : []);
      setTiposDoc(Array.isArray(tdRes) ? tdRes : []);
    } catch (err) {
      console.error('Error cargando datos de usuarios:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreateModal = () => {
    setEditing(null);
    setForm({
      nombre_usuario: '',
      apellido_usuario: '',
      id_tipo_documento: tiposDoc[0]?.id_tipo_documento || 1,
      documento: '',
      telefono: '',
      contrasena: '',
      id_rol: roles[0]?.id_rol || 2
    });
    setIsOpenModal(true);
  };

  const handleOpenEditModal = (usr) => {
    setEditing(usr);
    setForm({
      nombre_usuario: usr.nombre_usuario || '',
      apellido_usuario: usr.apellido_usuario || '',
      id_tipo_documento: usr.id_tipo_documento || tiposDoc[0]?.id_tipo_documento || 1,
      documento: usr.documento || '',
      telefono: usr.telefono || '',
      contrasena: '',
      id_rol: usr.id_rol || roles[0]?.id_rol || 2
    });
    setIsOpenModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload = {
          nombre_usuario: form.nombre_usuario.trim(),
          apellido_usuario: form.apellido_usuario.trim(),
          id_tipo_documento: Number(form.id_tipo_documento),
          documento: form.documento.trim(),
          telefono: form.telefono?.trim() || null,
          id_rol: Number(form.id_rol)
        };
        await userService.update(editing.id_usuario, payload);
      } else {
        const payload = {
          nombre_usuario: form.nombre_usuario.trim(),
          apellido_usuario: form.apellido_usuario.trim(),
          id_tipo_documento: Number(form.id_tipo_documento),
          documento: form.documento.trim(),
          telefono: form.telefono?.trim() || null,
          contrasena: form.contrasena || '1234',
          id_rol: Number(form.id_rol)
        };
        await userService.create(payload);
      }
      setIsOpenModal(false);
      setEditing(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Desea eliminar este usuario?')) {
      try {
        await userService.delete(id);
        loadData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleToggleStatus = async (usr) => {
    try {
      await userService.updateStatus(usr.id_usuario, !usr.estado);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter((u) => {
    const query = search.toLowerCase();
    const fullName = `${u.nombre_usuario || ''} ${u.apellido_usuario || ''}`.toLowerCase();
    const doc = (u.documento || '').toLowerCase();
    const role = (u.nombre_rol || '').toLowerCase();
    const phone = (u.telefono || '').toLowerCase();
    return fullName.includes(query) || doc.includes(query) || role.includes(query) || phone.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            USUARIOS · GESTIÓN
          </span>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Gestión de Usuarios</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Administración de cuentas de acceso para Administradores y Empleados</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Nuevo Usuario
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex items-center gap-3 transition-colors">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar usuario por nombre, documento o rol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Tabla de Usuarios */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs transition-colors">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">USUARIO</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">TELÉFONO</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">ROL</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground text-center">ESTADO</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">CREADO</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-xs text-muted-foreground">
                  Cargando usuarios...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-xs text-muted-foreground">
                  No se encontraron usuarios registrados
                </td>
              </tr>
            ) : (
              filteredUsers.map((usr) => (
                <tr key={usr.id_usuario} className="hover:bg-muted/40 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-xs flex-shrink-0 border border-primary/20">
                      {usr.nombre_usuario ? usr.nombre_usuario.substring(0, 2).toUpperCase() : 'US'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">
                        {usr.nombre_usuario} {usr.apellido_usuario}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {usr.tipo_documento || 'CC'}: {usr.documento}
                      </p>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-mono text-foreground">{usr.telefono || 'N/A'}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-secondary/50 text-secondary-foreground border border-border">
                      {usr.nombre_rol || 'Sin Rol'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <ToggleSwitch
                      checked={Boolean(usr.estado)}
                      onChange={() => handleToggleStatus(usr)}
                    />
                  </td>
                  <td className="p-4 text-xs text-muted-foreground font-mono">
                    {usr.fecha_creacion ? new Date(usr.fecha_creacion).toLocaleDateString('es-CO') : 'N/A'}
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEditModal(usr)}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-colors"
                      title="Editar Usuario"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(usr.id_usuario)}
                      className="p-1.5 text-destructive hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer transition-colors"
                      title="Eliminar Usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Editar */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-popover text-popover-foreground border border-border w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h2 className="text-lg font-black text-foreground">
                {editing ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button
                onClick={() => setIsOpenModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Nombre <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan"
                    value={form.nombre_usuario}
                    onChange={(e) => setForm({ ...form, nombre_usuario: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Apellido <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Pérez"
                    value={form.apellido_usuario}
                    onChange={(e) => setForm({ ...form, apellido_usuario: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Tipo de Documento</label>
                  <select
                    value={form.id_tipo_documento}
                    onChange={(e) => setForm({ ...form, id_tipo_documento: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer"
                  >
                    {tiposDoc.map((td) => (
                      <option key={td.id_tipo_documento} value={td.id_tipo_documento}>
                        {td.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Documento <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 1001000001"
                    value={form.documento}
                    onChange={(e) => setForm({ ...form, documento: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej: 310-234-5678"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Rol del Sistema</label>
                  <select
                    value={form.id_rol}
                    onChange={(e) => setForm({ ...form, id_rol: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r.id_rol} value={r.id_rol}>
                        {r.nombre_rol}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!editing && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Contraseña <span className="text-primary">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Asigna una contraseña"
                    value={form.contrasena}
                    onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-foreground text-sm bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] shadow-md shadow-primary/20 transition-all cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
