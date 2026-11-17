import React, { useEffect, useState, useCallback } from 'react';
import { supplierService } from '../services/supplierService';
import { Plus, Search, Trash2, Edit2, X, Truck, Phone, Mail, Building, User } from 'lucide-react';
import ToggleSwitch from '../../../components/ui/ToggleSwitch';

export const SupplierManager = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [tiposDoc, setTiposDoc] = useState([]);
  const [search, setSearch] = useState('');
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nombre_proveedor: '',
    persona_juridica: true,
    id_tipo_documento: 3,
    documento: '',
    contacto_persona: '',
    telefono_proveedor: '',
    correo_proveedor: '',
    direccion_proveedor: ''
  });

  const loadData = useCallback(async () => {
    try {
      const [sRes, tdRes] = await Promise.all([
        supplierService.getAll(),
        supplierService.getTiposDocumento()
      ]);
      setSuppliers(Array.isArray(sRes) ? sRes : []);
      setTiposDoc(Array.isArray(tdRes) ? tdRes : []);
    } catch (err) {
      console.error('Error cargando proveedores:', err);
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
      nombre_proveedor: '',
      persona_juridica: true,
      id_tipo_documento: tiposDoc[2]?.id_tipo_documento || tiposDoc[0]?.id_tipo_documento || 3,
      documento: '',
      contacto_persona: '',
      telefono_proveedor: '',
      correo_proveedor: '',
      direccion_proveedor: ''
    });
    setIsOpenModal(true);
  };

  const handleOpenEditModal = (sup) => {
    setEditing(sup);
    setForm({
      nombre_proveedor: sup.nombre_proveedor || '',
      persona_juridica: Boolean(sup.persona_juridica),
      id_tipo_documento: sup.id_tipo_documento || tiposDoc[0]?.id_tipo_documento || 3,
      documento: sup.documento || '',
      contacto_persona: sup.contacto_persona || sup.nombre_contacto || '',
      telefono_proveedor: sup.telefono_proveedor || '',
      correo_proveedor: sup.correo_proveedor || '',
      direccion_proveedor: sup.direccion_proveedor || ''
    });
    setIsOpenModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nombre_proveedor: form.nombre_proveedor.trim(),
        persona_juridica: form.persona_juridica,
        id_tipo_documento: Number(form.id_tipo_documento),
        documento: form.documento.trim(),
        contacto_persona: form.contacto_persona.trim(),
        telefono_proveedor: form.telefono_proveedor.trim(),
        correo_proveedor: form.correo_proveedor.trim() || null,
        direccion_proveedor: form.direccion_proveedor.trim() || null
      };

      if (editing) {
        await supplierService.update(editing.id_proveedor, payload);
      } else {
        await supplierService.create(payload);
      }
      setIsOpenModal(false);
      setEditing(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Desea eliminar este proveedor?')) {
      try {
        await supplierService.delete(id);
        loadData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleToggleStatus = async (sup) => {
    try {
      await supplierService.updateStatus(sup.id_proveedor, !sup.estado);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredSuppliers = (Array.isArray(suppliers) ? suppliers : []).filter((s) => {
    const query = search.toLowerCase();
    const name = (s.nombre_proveedor || '').toLowerCase();
    const doc = (s.documento || '').toLowerCase();
    const contact = (s.contacto_persona || s.nombre_contacto || '').toLowerCase();
    const phone = (s.telefono_proveedor || '').toLowerCase();
    const email = (s.correo_proveedor || '').toLowerCase();
    return name.includes(query) || doc.includes(query) || contact.includes(query) || phone.includes(query) || email.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            COMPRAS · PROVEEDORES
          </span>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Proveedores y Aliados</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gestión integral de empresas distribuidoras y fabricantes</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.98] shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Nuevo Proveedor
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex items-center gap-3 transition-colors">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar proveedor por nombre, NIT, contacto o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Tabla de Proveedores */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs transition-colors">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">PROVEEDOR</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">PERSONERÍA</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">CONTACTO</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">TELÉFONO</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground text-center">ESTADO</th>
              <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {loading && suppliers.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-xs text-muted-foreground">
                  Cargando proveedores...
                </td>
              </tr>
            ) : filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-xs text-muted-foreground">
                  No se encontraron proveedores registrados
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((sup) => (
                <tr key={sup.id_proveedor} className="hover:bg-muted/40 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-sm text-foreground">{sup.nombre_proveedor}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {sup.tipo_documento || 'NIT'}: {sup.documento}
                    </p>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                        sup.persona_juridica
                          ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
                          : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                      }`}
                    >
                      {sup.persona_juridica ? <Building className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {sup.persona_juridica ? 'Jurídica' : 'Natural'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-foreground">
                    <p className="font-medium">{sup.contacto_persona || sup.nombre_contacto || 'N/A'}</p>
                    {sup.correo_proveedor && (
                      <p className="text-xs text-muted-foreground mt-0.5">{sup.correo_proveedor}</p>
                    )}
                  </td>
                  <td className="p-4 text-sm font-mono text-foreground">{sup.telefono_proveedor || 'N/A'}</td>
                  <td className="p-4 text-center">
                    <ToggleSwitch
                      checked={Boolean(sup.estado)}
                      onChange={() => handleToggleStatus(sup)}
                    />
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEditModal(sup)}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-colors"
                      title="Editar Proveedor"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sup.id_proveedor)}
                      className="p-1.5 text-destructive hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer transition-colors"
                      title="Eliminar Proveedor"
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
                {editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h2>
              <button
                onClick={() => setIsOpenModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Nombre del Proveedor / Razón Social <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carvajal Educación S.A.S."
                  value={form.nombre_proveedor}
                  onChange={(e) => setForm({ ...form, nombre_proveedor: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Personería</label>
                  <select
                    value={form.persona_juridica ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, persona_juridica: e.target.value === 'true' })}
                    className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer"
                  >
                    <option value="true">Persona Jurídica</option>
                    <option value="false">Persona Natural</option>
                  </select>
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Documento / NIT <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 890.123.456-1"
                    value={form.documento}
                    onChange={(e) => setForm({ ...form, documento: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej: 310-987-6543"
                    value={form.telefono_proveedor}
                    onChange={(e) => setForm({ ...form, telefono_proveedor: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Persona de Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej: Carlos Mendoza"
                    value={form.contacto_persona}
                    onChange={(e) => setForm({ ...form, contacto_persona: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="ventas@proveedor.com"
                    value={form.correo_proveedor}
                    onChange={(e) => setForm({ ...form, correo_proveedor: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Dirección</label>
                <input
                  type="text"
                  placeholder="Ej: Calle 10 #42-15 Medellín"
                  value={form.direccion_proveedor}
                  onChange={(e) => setForm({ ...form, direccion_proveedor: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
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
