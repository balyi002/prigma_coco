import React, { useState, useEffect } from 'react';
import { 
  Search, Download, Eye, Printer, Ban, Trash2,
  ChevronLeft, ChevronRight, CheckCircle2, 
  DollarSign, ShoppingCart, TrendingUp, X 
} from 'lucide-react';
import api from '../../utils/api';
import { formatCOP, printTicket } from '../../utils/format';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const seedSales = [
  {
    id: 'VTA001',
    id_pedido: 1,
    cliente: 'María García',
    avatar: 'MG',
    fecha: '10/08/2026 · 14:32',
    articulos: '3 ítem(s)',
    detalleItems: [
      { desc: 'Cuaderno Doble Línea 100H', cant: 2, precio: 12000 },
      { desc: 'Caja Lápices Grafito Faber-Castell', cant: 1, precio: 28360 }
    ],
    total: 52360,
    metodo: 'Efectivo',
    estado: 'Completado'
  },
  {
    id: 'VTA002',
    id_pedido: 2,
    cliente: 'Ana Rodríguez',
    avatar: 'AR',
    fecha: '10/08/2026 · 14:15',
    articulos: '2 ítem(s)',
    detalleItems: [
      { desc: 'Carpeta Plástica Oficio', cant: 3, precio: 15000 },
      { desc: 'Marcadores Borrables x4', cant: 1, precio: 26650 }
    ],
    total: 41650,
    metodo: 'Transferencia',
    estado: 'Completado'
  },
  {
    id: 'VTA003',
    id_pedido: 3,
    cliente: 'Laura Martínez',
    avatar: 'LM',
    fecha: '10/08/2026 · 13:58',
    articulos: '2 ítem(s)',
    detalleItems: [
      { desc: 'Calculadora Científica Casio FX', cant: 1, precio: 85000 },
      { desc: 'Pegante en Barra Grande', cant: 2, precio: 20910 }
    ],
    total: 105910,
    metodo: 'Transferencia',
    estado: 'Completado'
  },
  {
    id: 'VTA004',
    id_pedido: 4,
    cliente: 'Valentina Cruz',
    avatar: 'VC',
    fecha: '09/08/2026 · 11:20',
    articulos: '2 ítem(s)',
    detalleItems: [
      { desc: 'Resma Papel Carta Reprograf', cant: 2, precio: 80000 },
      { desc: 'Grapadora Metálica + Grapas', cant: 1, precio: 33050 }
    ],
    total: 113050,
    metodo: 'Efectivo',
    estado: 'Completado'
  },
  {
    id: 'VTA005',
    id_pedido: 5,
    cliente: 'Sofía López',
    avatar: 'SL',
    fecha: '08/08/2026 · 16:45',
    articulos: '2 ítem(s)',
    detalleItems: [
      { desc: 'Tijeras de Precisión', cant: 2, precio: 25200 },
      { desc: 'Block Papel Mantequilla', cant: 2, precio: 70000 }
    ],
    total: 95200,
    metodo: 'Transferencia',
    estado: 'Completado'
  }
];

export default function Ventas() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('Todos');
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [alertaTicket, setAlertaTicket] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', onConfirm: null });

  // Cargar ventas completadas desde la base de datos simulada
  const fetchVentas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pedidos');
      const pedidosCompletados = (res.data || [])
        .filter((o) => (o.nombre_estado || '').toLowerCase() === 'completado')
        .map((o) => {
          const prods = o.detalles?.productos || [];
          const servs = o.detalles?.servicios || [];
          const totalItems = prods.reduce((s, p) => s + (p.cantidad || 1), 0) + servs.reduce((s, p) => s + (p.cantidad || 1), 0);
          
          return {
            id: `VTA${String(o.id_pedido).padStart(3, '0')}`,
            id_pedido: o.id_pedido,
            cliente: o.nombre_cliente || 'Consumidor Final',
            avatar: o.nombre_cliente ? o.nombre_cliente.trim().substring(0, 2).toUpperCase() : 'CF',
            fecha: o.fecha_pedido
              ? new Date(o.fecha_pedido).toLocaleDateString('es-CO') + ' · ' + new Date(o.fecha_pedido).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
              : 'Hoy',
            articulos: `${totalItems || o.total_articulos || 1} ítem(s)`,
            detalleItems: [
              ...prods.map(p => ({ desc: p.nombre_producto, cant: p.cantidad, precio: p.precio_unitario })),
              ...servs.map(s => ({ desc: s.nombre_servicio, cant: s.cantidad, precio: s.precio_unitario }))
            ],
            total: o.total,
            metodo: o.metodo_pago || 'Efectivo',
            estado: 'Completado'
          };
        });

      // Unir con ventas base evitando duplicados
      const combined = [...pedidosCompletados];
      seedSales.forEach(s => {
        if (!combined.some(c => c.id === s.id)) {
          combined.push(s);
        }
      });
      setVentas(combined);
    } catch (err) {
      console.error('Error cargando ventas:', err);
      setVentas(seedSales);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, []);

  const formatoCOP = (monto) => formatCOP(monto);

  // Filtrado
  const ventasFiltradas = ventas.filter((v) => {
    const coincideBusqueda = 
      (v.cliente || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (v.id || '').toLowerCase().includes(busqueda.toLowerCase());
    const coincideMetodo = filtroMetodo === 'Todos' || v.metodo === filtroMetodo;
    return coincideBusqueda && coincideMetodo;
  });

  // Métricas
  const totalVentas = ventas.reduce((acc, v) => v.estado !== 'Anulado' ? acc + v.total : acc, 0);
  const cantidadVentas = ventas.filter(v => v.estado !== 'Anulado').length;
  const ticketPromedio = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

  // Anular Venta
  const anularVenta = (id) => {
    if (window.confirm(`¿Estás seguro de anular la venta ${id}? Esta acción revertirá el inventario.`)) {
      setVentas(ventas.map(v => v.id === id ? { ...v, estado: 'Anulado' } : v));
    }
  };

  // Eliminar Venta (Permiso total del Administrador dueño del negocio)
  const eliminarVenta = (venta) => {
    setConfirmState({
      open: true,
      title: `¿Eliminar permanentemente la venta ${venta.id}?`,
      message: `Como Administrador tienes control total para eliminar registros de venta. Se eliminará la transacción de ${venta.cliente} por valor de ${formatoCOP(venta.total)}.`,
      onConfirm: async () => {
        try {
          if (venta.id_pedido) {
            await api.delete(`/pedidos/${venta.id_pedido}`);
          }
          setVentas(prev => prev.filter(v => v.id !== venta.id));
          setConfirmState({ open: false, title: '', message: '', onConfirm: null });
        } catch (err) {
          console.error('Error eliminando venta:', err);
          alert('Error al eliminar venta');
          setConfirmState({ open: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  const imprimirTicketVenta = (venta) => {
    setAlertaTicket(`Imprimiendo comprobante de venta para ${venta.id} - ${venta.cliente}...`);
    printTicket({
      id_pedido: venta.id_pedido || venta.id,
      nombre_cliente: venta.cliente,
      metodo_pago: venta.metodo,
      nombre_estado: venta.estado,
      total: venta.total,
      items: (venta.detalleItems || []).map(d => ({ name: d.desc, qty: d.cant, price: d.precio }))
    });
    setTimeout(() => setAlertaTicket(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Notificación de Impresión */}
      {alertaTicket && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <Printer className="w-4 h-4 text-primary animate-pulse" />
          <span>{alertaTicket}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">VENTAS</span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Historial de Ventas</h1>
          <p className="text-sm text-muted-foreground">
            Transacciones completadas desde el punto de venta y pedidos facturados de la papelería
          </p>
        </div>

        <button 
          onClick={() => alert('Exportando reporte de ventas completadas a CSV...')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4 text-primary" />
          <span>Exportar</span>
        </button>
      </div>

      {/* Tarjetas KPI Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium">Total Recaudado</span>
            <p className="text-xl font-black text-foreground font-mono">{formatoCOP(totalVentas)}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium">Nº Ventas</span>
            <p className="text-xl font-black text-foreground font-mono">{cantidadVentas}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium">Ticket Promedio</span>
            <p className="text-xl font-black text-foreground font-mono">{formatoCOP(ticketPromedio)}</p>
          </div>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente o ID de venta..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-xs"
          />
        </div>

        <select
          value={filtroMetodo}
          onChange={(e) => setFiltroMetodo(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-xs font-medium cursor-pointer"
        >
          <option value="Todos">Todos los métodos</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
        </select>
      </div>

      {/* Tabla de Ventas */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Artículos</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Método</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-muted-foreground">
                    Cargando ventas completadas...
                  </td>
                </tr>
              ) : ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-muted-foreground">
                    No se encontraron registros de ventas coincidentes.
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">{venta.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                          {venta.avatar}
                        </div>
                        <span className="font-semibold text-foreground">{venta.cliente}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">{venta.fecha}</td>
                    <td className="py-3.5 px-4 text-foreground font-medium">{venta.articulos}</td>
                    <td className="py-3.5 px-4 font-black font-mono text-foreground">{formatoCOP(venta.total)}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-foreground">{venta.metodo}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        venta.estado === 'Completado' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {venta.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setVentaSeleccionada(venta)}
                          title="Ver detalle"
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => imprimirTicketVenta(venta)}
                          title="Imprimir ticket"
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-slate-500" />
                        </button>
                        {venta.estado !== 'Anulado' && (
                          <button
                            onClick={() => anularVenta(venta.id)}
                            title="Anular venta"
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          >
                            <Ban className="w-4 h-4 text-amber-500" />
                          </button>
                        )}
                        {/* Botón de eliminación con permiso total de Admin */}
                        <button
                          onClick={() => eliminarVenta(venta)}
                          title="Eliminar Venta (Admin)"
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Detalle de Venta */}
      {ventaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">COMPROBANTE</span>
                <h3 className="text-base font-bold text-foreground">Detalle de Venta {ventaSeleccionada.id}</h3>
              </div>
              <button
                onClick={() => setVentaSeleccionada(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-xl border border-border">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <p className="font-bold text-foreground text-sm">{ventaSeleccionada.cliente}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha y hora:</span>
                  <p className="font-medium text-foreground">{ventaSeleccionada.fecha}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Método de pago:</span>
                  <p className="font-medium text-foreground">{ventaSeleccionada.metodo}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{ventaSeleccionada.estado}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-foreground mb-2">Artículos Facturados</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {ventaSeleccionada.detalleItems?.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 border-b border-border">
                      <div>
                        <p className="font-medium text-foreground">{it.desc}</p>
                        <span className="text-[11px] text-muted-foreground">{it.cant} unidad(es)</span>
                      </div>
                      <span className="font-bold font-mono text-foreground">{formatoCOP(it.precio * it.cant)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-sm font-black text-foreground border-t border-border">
                <span>Total Facturado:</span>
                <span className="text-lg font-mono text-primary">{formatoCOP(ventaSeleccionada.total)}</span>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
              <button
                onClick={() => setVentaSeleccionada(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  imprimirTicketVenta(ventaSeleccionada);
                  setVentaSeleccionada(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:opacity-90 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
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
