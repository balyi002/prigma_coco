import React, { useState, useEffect } from 'react';
import { 
  BookmarkCheck, Plus, Search, DollarSign, Calendar, 
  User, CheckCircle, Clock, AlertTriangle, X, 
  Receipt, ArrowRight, ShieldCheck, Printer, Trash2,
  Package, Info, Tag
} from 'lucide-react';
import api from '../../utils/api';
import { formatCOP } from '../../utils/format';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function GestionSeparados() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [separados, setSeparados] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalAbonar, setModalAbonar] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', onConfirm: null });

  // Formulario de nuevo separado con catálogo
  const [formNuevo, setFormNuevo] = useState({
    cliente: '',
    telefono: '',
    documento: '',
    id_producto: '',
    producto: '',
    cantidad: 1,
    total: '',
    abonoInicial: '',
    metodoPago: 'Efectivo',
    fechaLimite: '',
    notas: ''
  });

  // Formulario para registrar nuevo abono
  const [montoAbono, setMontoAbono] = useState('');
  const [metodoAbono, setMetodoAbono] = useState('Efectivo');

  // Cargar separados y productos desde el mock DB
  const fetchData = async () => {
    try {
      setLoading(true);
      const [sepRes, prodRes] = await Promise.all([
        api.get('/separados'),
        api.get('/productos')
      ]);
      setSeparados(sepRes.data || []);
      setProductos((prodRes.data || []).filter(p => p.estado !== 0 && p.estado !== false));
    } catch (err) {
      console.error('Error cargando separados y productos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Formato COP
  const formatoCOP = (m) => formatCOP(m);

  // Cálculos de métricas
  const totalEnSeparados = separados.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  const totalAbonado = separados.reduce((acc, s) => acc + (Number(s.abonado) || 0), 0);
  const saldoPorCobrar = totalEnSeparados - totalAbonado;
  const cantidadActivos = separados.filter(s => s.estado === 'En Curso').length;

  // Filtrado
  const separadosFiltrados = separados.filter(s => {
    const coincideTexto = 
      (s.cliente || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (s.id || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (s.producto || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (s.documento || '').toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === 'Todos' || s.estado === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  // Cuando el usuario selecciona un producto del catálogo en el formulario
  const handleSelectProduct = (idProd) => {
    const p = productos.find(x => x.id_producto === Number(idProd));
    if (p) {
      const cant = formNuevo.cantidad || 1;
      setFormNuevo(prev => ({
        ...prev,
        id_producto: p.id_producto,
        producto: p.nombre_producto,
        total: String(p.precio_venta * cant)
      }));
    } else {
      setFormNuevo(prev => ({
        ...prev,
        id_producto: '',
        producto: '',
        total: ''
      }));
    }
  };

  const handleQuantityChange = (newQty) => {
    const cant = Math.max(1, Number(newQty));
    const p = productos.find(x => x.id_producto === Number(formNuevo.id_producto));
    setFormNuevo(prev => ({
      ...prev,
      cantidad: cant,
      total: p ? String(p.precio_venta * cant) : prev.total
    }));
  };

  // Guardar nuevo separado
  const handleCrearSeparado = async (e) => {
    e.preventDefault();
    const tot = parseFloat(formNuevo.total);
    const ab = parseFloat(formNuevo.abonoInicial || 0);

    if (ab > tot) {
      alert('El abono inicial no puede ser mayor que el total del producto.');
      return;
    }

    const selectedProd = productos.find(x => x.id_producto === Number(formNuevo.id_producto));
    if (selectedProd && formNuevo.cantidad > selectedProd.stock) {
      alert(`No hay stock suficiente para ${selectedProd.nombre_producto}. Stock disponible: ${selectedProd.stock}`);
      return;
    }

    try {
      const payload = {
        cliente: formNuevo.cliente,
        telefono: formNuevo.telefono,
        documento: formNuevo.documento,
        id_producto: formNuevo.id_producto || null,
        producto: formNuevo.producto || 'Producto de Papelería',
        cantidad: Number(formNuevo.cantidad) || 1,
        total: tot,
        abonoInicial: ab,
        metodoPago: formNuevo.metodoPago,
        fechaLimite: formNuevo.fechaLimite || '15 días hábiles',
        notas: formNuevo.notas
      };

      await api.post('/separados', payload);
      await fetchData(); // Recargar separados y catálogo (stock descontado)
      setModalNuevo(false);
      setFormNuevo({
        cliente: '',
        telefono: '',
        documento: '',
        id_producto: '',
        producto: '',
        cantidad: 1,
        total: '',
        abonoInicial: '',
        metodoPago: 'Efectivo',
        fechaLimite: '',
        notas: ''
      });
    } catch (err) {
      console.error('Error creando separado:', err);
      alert('Error al registrar el separado');
    }
  };

  // Registrar abono a un separado existente
  const handleRegistrarAbono = async (e) => {
    e.preventDefault();
    const monto = parseFloat(montoAbono);
    if (!monto || monto <= 0) return;

    const saldoPendiente = modalAbonar.total - modalAbonar.abonado;
    if (monto > saldoPendiente) {
      alert(`El monto ($ ${monto}) supera el saldo pendiente de esta cuenta ($ ${saldoPendiente}).`);
      return;
    }

    try {
      await api.patch(`/separados/${modalAbonar.id}/abono`, {
        monto,
        metodo: metodoAbono
      });
      await fetchData();
      setModalAbonar(null);
      setMontoAbono('');
    } catch (err) {
      console.error('Error registrando abono:', err);
      alert('Error al registrar el abono');
    }
  };

  // Eliminar separado (Control total del Administrador)
  const handleDeleteSeparado = (item) => {
    setConfirmState({
      open: true,
      title: `¿Eliminar separado ${item.id}?`,
      message: `Como Administrador, puedes eliminar este apartado de ${item.cliente}. La mercancía reservada (${item.producto}) será liberada.`,
      onConfirm: async () => {
        try {
          await api.delete(`/separados/${item.id}`);
          setSeparados(prev => prev.filter(s => s.id !== item.id));
          setConfirmState({ open: false, title: '', message: '', onConfirm: null });
        } catch (err) {
          console.error('Error eliminando separado:', err);
          alert('Error al eliminar el separado');
          setConfirmState({ open: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  const selectedProdInfo = productos.find(p => p.id_producto === Number(formNuevo.id_producto));

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            VENTAS · SISTEMA DE APARTADOS
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestión de Separados</h1>
          <p className="text-sm text-muted-foreground">
            Reserva de artículos de papelería con selección de catálogo, descuento de stock y control de abonos.
          </p>
        </div>

        <button
          onClick={() => {
            setFormNuevo({
              cliente: '',
              telefono: '',
              documento: '',
              id_producto: productos[0]?.id_producto || '',
              producto: productos[0]?.nombre_producto || '',
              cantidad: 1,
              total: productos[0] ? String(productos[0].precio_venta) : '',
              abonoInicial: '',
              metodoPago: 'Efectivo',
              fechaLimite: '',
              notas: ''
            });
            setModalNuevo(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Separado</span>
        </button>
      </div>

      {/* Métricas / KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Total en Separados</span>
            <BookmarkCheck className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-black text-foreground">{formatoCOP(totalEnSeparados)}</p>
          <span className="text-[11px] text-muted-foreground">Valor total en mercancía apartada</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Recaudado en Abonos</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatoCOP(totalAbonado)}</p>
          <span className="text-[11px] text-muted-foreground">Dinero ingresado a caja</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Saldo por Cobrar</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400">{formatoCOP(saldoPorCobrar)}</p>
          <span className="text-[11px] text-muted-foreground">Pendiente para entrega de productos</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Separados Activos</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-black text-foreground">{cantidadActivos}</p>
          <span className="text-[11px] text-muted-foreground">Clientes con plan separe en curso</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, cédula, folio o producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-xs"
          />
        </div>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-xs font-medium cursor-pointer"
        >
          <option value="Todos">Todos los estados</option>
          <option value="En Curso">En Curso</option>
          <option value="Liquidado">Liquidados / Entregados</option>
          <option value="Vencido">Vencidos</option>
        </select>
      </div>

      {/* Tabla de Separados */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <th className="py-3.5 px-4">Folio</th>
                <th className="py-3.5 px-4">Cliente / Contacto</th>
                <th className="py-3.5 px-4">Artículo de Papelería</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Progreso de Abono</th>
                <th className="py-3.5 px-4">Saldo Pendiente</th>
                <th className="py-3.5 px-4">Límite</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-muted-foreground">
                    Cargando separados...
                  </td>
                </tr>
              ) : separadosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-muted-foreground">
                    No hay apartados registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                separadosFiltrados.map((item) => {
                  const saldo = item.total - item.abonado;
                  const porcentaje = Math.min(100, Math.round((item.abonado / item.total) * 100));

                  return (
                    <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">{item.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                            {item.avatar || 'SP'}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{item.cliente}</p>
                            <span className="text-[10px] text-muted-foreground">
                              {item.telefono} {item.documento ? `· CC: ${item.documento}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground max-w-[200px] truncate">
                        {item.producto} {item.cantidad > 1 ? `(x${item.cantidad})` : ''}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground font-mono">{formatoCOP(item.total)}</td>
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-muted-foreground font-mono">
                            <span>{formatoCOP(item.abonado)}</span>
                            <span>{porcentaje}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                porcentaje >= 100 ? 'bg-emerald-500' : 'bg-primary'
                              }`}
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-black font-mono">
                        {saldo <= 0 ? (
                          <span className="text-emerald-500 font-bold">¡Pagado!</span>
                        ) : (
                          <span className="text-primary">{formatoCOP(saldo)}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-medium">{item.fechaLimite}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.estado === 'Liquidado'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : item.estado === 'En Curso'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-primary/10 text-primary border-primary/20'
                        }`}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.estado === 'En Curso' && (
                            <button
                              onClick={() => {
                                setModalAbonar(item);
                                setMontoAbono('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all cursor-pointer shadow-xs"
                            >
                              Abonar
                            </button>
                          )}
                          <button
                            onClick={() => setModalDetalle(item)}
                            title="Ver historial de abonos"
                            className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                          >
                            <Receipt className="w-4 h-4 text-purple-500" />
                          </button>
                          {/* Botón de eliminación con permiso total de Admin */}
                          <button
                            onClick={() => handleDeleteSeparado(item)}
                            title="Eliminar Separado (Admin)"
                            className="p-1.5 rounded-lg border border-border hover:bg-red-50 dark:hover:bg-red-950/40 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: NUEVO SEPARADO CON CATÁLOGO DE PRODUCTOS */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">NUEVO REGISTRO</span>
                <h3 className="text-base font-bold text-foreground">Apartar Producto del Catálogo</h3>
              </div>
              <button 
                onClick={() => setModalNuevo(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearSeparado} className="p-5 space-y-3.5 text-xs max-h-[85vh] overflow-y-auto">
              {/* Información del Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Nombre del Cliente *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    value={formNuevo.cliente}
                    onChange={(e) => setFormNuevo({ ...formNuevo, cliente: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Teléfono / WhatsApp *</label>
                  <input
                    required
                    type="tel"
                    placeholder="Ej. 300 123 4567"
                    value={formNuevo.telefono}
                    onChange={(e) => setFormNuevo({ ...formNuevo, telefono: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">Cédula / Documento (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. 1098765432"
                  value={formNuevo.documento}
                  onChange={(e) => setFormNuevo({ ...formNuevo, documento: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground font-mono focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>

              {/* LISTADO DE PRODUCTOS PARA SELECCIONAR (Requerimiento de usuario) */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-foreground font-bold">
                  Seleccionar Producto del Inventario *
                </label>
                <select
                  required
                  value={formNuevo.id_producto}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-input-background text-foreground font-bold focus:ring-2 focus:ring-ring focus:outline-none cursor-pointer"
                >
                  <option value="">-- Elige un producto del catálogo --</option>
                  {productos.map((prod) => (
                    <option key={prod.id_producto} value={prod.id_producto}>
                      {prod.nombre_producto} · {formatoCOP(prod.precio_venta)} (Stock: {prod.stock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tarjeta Explicativa de Conexión a Base de Datos y Descuento de Stock */}
              {selectedProdInfo ? (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <Package className="w-4 h-4" />
                    <span>Detalles del Producto Seleccionado:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-muted-foreground">Categoría:</span>
                      <p className="font-bold text-foreground">{selectedProdInfo.nombre_categoria || 'Varios'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Stock Físico Actual:</span>
                      <p className="font-mono font-bold text-foreground">{selectedProdInfo.stock} unidades</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Precio Unitario:</span>
                      <p className="font-mono font-bold text-primary">{formatoCOP(selectedProdInfo.precio_venta)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Código de Ref:</span>
                      <p className="font-mono font-bold text-foreground">P{String(selectedProdInfo.id_producto).padStart(3, '0')}</p>
                    </div>
                  </div>

                  {/* NOTA EXPLICATIVA TÉCNICA PARA LA BD */}
                  <div className="flex items-start gap-2 bg-card p-2.5 rounded-lg border border-border text-[11px] text-muted-foreground leading-relaxed">
                    <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground">Flujo con Base de Datos:</strong> Al registrar este separado, el sistema descuenta automáticamente las unidades apartadas del stock disponible en la base de datos (mediante trigger SQL), garantizando que ningún otro vendedor ofrezca esta mercancía reservada.
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Cantidad y Totales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Cantidad a Separar *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max={selectedProdInfo?.stock || 99}
                    value={formNuevo.cantidad}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground font-bold focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Precio Total Calculado ($ COP) *</label>
                  <input
                    required
                    type="number"
                    min="1000"
                    placeholder="Total"
                    value={formNuevo.total}
                    onChange={(e) => setFormNuevo({ ...formNuevo, total: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground font-bold font-mono focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Abono Inicial ($ COP)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej. 20000"
                    value={formNuevo.abonoInicial}
                    onChange={(e) => setFormNuevo({ ...formNuevo, abonoInicial: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground font-bold font-mono focus:ring-2 focus:ring-ring focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Método de Pago del Abono</label>
                  <select
                    value={formNuevo.metodoPago}
                    onChange={(e) => setFormNuevo({ ...formNuevo, metodoPago: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-ring focus:outline-none cursor-pointer"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia / Nequi / Daviplata</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">Fecha Límite para Liquidar *</label>
                <input
                  required
                  type="date"
                  value={formNuevo.fechaLimite}
                  onChange={(e) => setFormNuevo({ ...formNuevo, fechaLimite: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!formNuevo.id_producto}
                  className="px-4 py-2 rounded-xl bg-primary hover:opacity-90 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  Guardar y Reservar Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR ABONO */}
      {modalAbonar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">INGRESAR PAGO</span>
                <h3 className="text-base font-bold text-foreground">Abonar a {modalAbonar.id}</h3>
              </div>
              <button 
                onClick={() => setModalAbonar(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarAbono} className="p-5 space-y-4 text-xs">
              <div className="bg-muted/40 p-3 rounded-xl border border-border space-y-1">
                <p className="font-semibold text-foreground text-sm">{modalAbonar.cliente}</p>
                <p className="text-muted-foreground truncate">{modalAbonar.producto}</p>
                <div className="flex justify-between pt-2 border-t border-border mt-2 font-bold">
                  <span>Saldo Restante:</span>
                  <span className="text-primary font-black font-mono">
                    {formatoCOP(modalAbonar.total - modalAbonar.abonado)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">Monto a Abonar ($ COP) *</label>
                <input
                  required
                  autoFocus
                  type="number"
                  min="500"
                  max={modalAbonar.total - modalAbonar.abonado}
                  placeholder="Ingrese el monto recibido"
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground font-black font-mono text-base focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">Método de Pago</label>
                <select
                  value={metodoAbono}
                  onChange={(e) => setMetodoAbono(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-ring focus:outline-none cursor-pointer"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia / Nequi / Daviplata</option>
                </select>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAbonar(null)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: HISTORIAL DE ABONOS Y DETALLE */}
      {modalDetalle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">HISTORIAL COMPLETO</span>
                <h3 className="text-base font-bold text-foreground">Detalle del Separado {modalDetalle.id}</h3>
              </div>
              <button 
                onClick={() => setModalDetalle(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-xl border border-border">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <p className="font-bold text-foreground">{modalDetalle.cliente}</p>
                  <span className="text-[10px] text-muted-foreground">{modalDetalle.telefono}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha Límite:</span>
                  <p className="font-bold text-foreground">{modalDetalle.fechaLimite}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Artículo:</span>
                  <p className="font-semibold text-foreground">{modalDetalle.producto}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-foreground mb-2">Historial de Abonos Recibidos</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {(modalDetalle.historialAbonos || []).length === 0 ? (
                    <p className="text-muted-foreground italic text-center py-2">Sin abonos registrados aún.</p>
                  ) : (
                    modalDetalle.historialAbonos.map((ab, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <div>
                            <p className="font-semibold text-foreground font-mono">{formatoCOP(ab.monto)}</p>
                            <span className="text-[10px] text-muted-foreground">{ab.fecha}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground">{ab.metodo}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-sm font-bold">
                <span className="text-muted-foreground">Saldo Restante:</span>
                <span className={`text-base font-black font-mono ${
                  modalDetalle.total - modalDetalle.abonado <= 0 ? 'text-emerald-500' : 'text-primary'
                }`}>
                  {formatoCOP(modalDetalle.total - modalDetalle.abonado)}
                </span>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
              <button
                onClick={() => setModalDetalle(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, title: '', message: '', onConfirm: null })}
      />
    </div>
  );
}
