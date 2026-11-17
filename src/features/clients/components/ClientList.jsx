import React, { useEffect, useState, useCallback } from 'react';
import { clientService } from '../services/clientService';
import { Plus, Search, Trash2, Edit2, X, Users, UserCheck, UserX } from 'lucide-react';
import ToggleSwitch from '../../../components/ui/ToggleSwitch';

export const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [nombreCliente, setNombreCliente] = useState('');

  const loadData = useCallback(async () => {
    try {
      const data = await clientService.getAll();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreateModal = () => {
    setEditing(null);
    setNombreCliente('');
    setIsOpenModal(true);
  };

  const handleOpenEditModal = (client) => {
    setEditing(client);
    setNombreCliente(client.nombre_cliente || '');
    setIsOpenModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = nombreCliente.trim();
    if (!trimmed) {
      alert('El nombre del cliente no puede estar vacío');
      return;
    }

    try {
      if (editing) {
        await clientService.update(editing.id_cliente, { nombre_cliente: trimmed });
      } else {
        await clientService.create({ nombre_cliente: trimmed });
      }
      setIsOpenModal(false);
      setEditing(null);
      setNombreCliente('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Desea eliminar este cliente?')) {
      try {
        await clientService.delete(id);
        loadData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleToggleStatus = async (client) => {
    try {
      await clientService.updateStatus(client.id_cliente, !client.estado);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const safeClients = Array.isArray(clients) ? clients : [];
  const totalClients = safeClients.length;
  const activeClients = safeClients.filter((c) => Boolean(c.estado)).length;
  const inactiveClients = safeClients.filter((c) => !c.estado).length;

  const filtered = safeClients.filter((c) =>
    (c.nombre_cliente || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            VENTAS · DIRECTORIO
          </span>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Directorio de Clientes</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gestión integral de clientes y compradores recurrentes</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      {/* Tarjetas de Métricas Dinámicas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs text-muted-foreground font-bold">Total Clientes</p>
            <h3 className="text-2xl font-black text-foreground mt-1">{totalClients}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs text-muted-foreground font-bold">Clientes Activos</p>
            <h3 className="text-2xl font-black text-foreground mt-1">{activeClients}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs text-muted-foreground font-bold">Clientes Inactivos</p>
            <h3 className="text-2xl font-black text-foreground mt-1">{inactiveClients}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300 flex items-center justify-center font-bold">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex items-center gap-3 transition-colors">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar cliente por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Tabla de Clientes */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs transition-colors">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">CLIENTE</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground text-center">ESTADO</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {loading && safeClients.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-xs text-muted-foreground">
                  Cargando clientes...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-xs text-muted-foreground">
                  No se encontraron clientes registrados
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr key={client.id_cliente} className="hover:bg-muted/40 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-xs flex-shrink-0 border border-primary/20">
                      {client.nombre_cliente ? client.nombre_cliente.substring(0, 2).toUpperCase() : 'CL'}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-foreground">{client.nombre_cliente}</span>
                      {client.documento && (
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">
                          {client.nombre_tipo_documento || 'CC'}: {client.documento}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <ToggleSwitch
                      checked={Boolean(client.estado)}
                      onChange={() => handleToggleStatus(client)}
                    />
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEditModal(client)}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-colors"
                      title="Editar Cliente"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id_cliente)}
                      className="p-1.5 text-destructive hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer transition-colors"
                      title="Eliminar Cliente"
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
          <div className="bg-popover text-popover-foreground border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h2 className="text-lg font-black text-foreground">
                {editing ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button
                onClick={() => setIsOpenModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Nombre Completo del Cliente <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                  autoFocus
                />
              </div>

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
