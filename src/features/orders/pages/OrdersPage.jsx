import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  FileDown,
  Eye,
  Printer,
  Trash2,
  FileText,
  PackagePlus,
  CheckCircle2,
  CreditCard,
  Banknote,
  Clock,
  Sparkles
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { formatCOP, printTicket } from '../../../utils/format';
import OrderDetailModal from '../components/OrderDetailModal';
import POSView from '../components/POSView';
import StatusBadge from '../../../components/ui/StatusBadge';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Pagination from '../../../components/ui/Pagination';
import Modal from '../../../components/ui/Modal';

const ITEMS_PER_PAGE = 5;

export default function OrdersPage({ currentUser, defaultToPOS = false, onNavigateBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isPOSOpen, setIsPOSOpen] = useState(defaultToPOS);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', onConfirm: null });

  // Modales de acciones de Pedidos Pendientes
  const [orderToAddProd, setOrderToAddProd] = useState(null);
  const [orderToComplete, setOrderToComplete] = useState(null);
  const [catalog, setCatalog] = useState({ productos: [], servicios: [] });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [addQuantity, setAddQuantity] = useState(1);
  const [completePaymentMethod, setCompletePaymentMethod] = useState('Efectivo');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error cargando pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalog = async () => {
    try {
      const data = await orderService.getPOSCatalog();
      setCatalog(data);
    } catch (err) {
      console.error('Error cargando catálogo para añadir productos:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCatalog();
  }, [isPOSOpen]);

  // REGLA CLAVE: En Pedidos SOLO aparecen los pedidos con estado "Pendiente"
  const pendingOrders = useMemo(() => {
    return orders.filter(
      (o) => (o.nombre_estado || '').toLowerCase() === 'pendiente'
    );
  }, [orders]);

  // Filtrado por buscador (nombre, cédula, ID)
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pendingOrders;
    return pendingOrders.filter((o) => {
      const idStr = `PED${String(o.id_pedido).padStart(3, '0')}`.toLowerCase();
      const matchName = o.nombre_cliente && o.nombre_cliente.toLowerCase().includes(q);
      const matchCedula = o.cedula_cliente && String(o.cedula_cliente).toLowerCase().includes(q);
      const matchId = idStr.includes(q);
      return matchName || matchCedula || matchId;
    });
  }, [pendingOrders, search]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const pagedOrders = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, page]);

  // Completar Venta: el pedido pasa a Completado y se va a la vista de Ventas
  const handleOpenCompleteModal = (order) => {
    setOrderToComplete(order);
    setCompletePaymentMethod(order.metodo_pago || 'Efectivo');
  };

  const handleConfirmCompleteOrder = async (e) => {
    e.preventDefault();
    if (!orderToComplete) return;

    setIsSubmittingAction(true);
    try {
      await orderService.completeOrder(orderToComplete.id_pedido, {
        metodo_pago: completePaymentMethod
      });
      // Refrescar listado: al pasar a Completado ya no se muestra en Pedidos (se traslada a Ventas)
      await fetchOrders();
      setOrderToComplete(null);
    } catch (err) {
      console.error('Error completando venta:', err);
      alert(err.response?.data?.error || err.message || 'Error al completar la venta');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Abrir Modal Añadir Producto a Pedido Pendiente
  const handleOpenAddProduct = (order) => {
    setOrderToAddProd(order);
    setSelectedProductId(catalog.productos[0]?.id_producto || '');
    setAddQuantity(1);
  };

  const handleConfirmAddProduct = async (e) => {
    e.preventDefault();
    if (!orderToAddProd || !selectedProductId) return;

    const chosenProd = catalog.productos.find((p) => p.id_producto === Number(selectedProductId));
    if (!chosenProd) return;

    if (addQuantity > chosenProd.stock) {
      alert(`No hay stock suficiente para ${chosenProd.nombre_producto}. Stock disponible: ${chosenProd.stock}`);
      return;
    }

    setIsSubmittingAction(true);
    try {
      await orderService.addProductToOrder(orderToAddProd.id_pedido, {
        id_producto: chosenProd.id_producto,
        cantidad: Number(addQuantity),
        precio_unitario: Number(chosenProd.precio_venta),
        tipo: 'Producto'
      });
      await Promise.all([fetchOrders(), fetchCatalog()]);
      setOrderToAddProd(null);
    } catch (err) {
      console.error('Error agregando producto:', err);
      alert(err.response?.data?.error || err.message || 'Error al agregar producto');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Eliminar pedido (Permiso total del Admin)
  const handleDeleteOrder = (order) => {
    const idFormatted = `PED${String(order.id_pedido).padStart(3, '0')}`;
    setConfirmState({
      open: true,
      title: `¿Eliminar pedido ${idFormatted}?`,
      message: 'Como Administrador, tienes control total para eliminar este registro. El stock reservado se reintegrará automáticamente al inventario.',
      onConfirm: async () => {
        try {
          await orderService.deleteOrder(order.id_pedido);
          setOrders((prev) => prev.filter((o) => o.id_pedido !== order.id_pedido));
          setConfirmState({ open: false, title: '', message: '', onConfirm: null });
        } catch (err) {
          console.error('Error eliminando pedido:', err);
          alert(err.response?.data?.error || err.message || 'Error al eliminar pedido');
          setConfirmState({ open: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  // Helpers de visualización
  const getInitials = (nombre) => {
    if (!nombre) return 'CL';
    const parts = nombre.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (nombre) => {
    const colors = [
      'bg-emerald-500 text-white',
      'bg-indigo-500 text-white',
      'bg-purple-500 text-white',
      'bg-pink-500 text-white',
      'bg-amber-500 text-white',
      'bg-teal-500 text-white'
    ];
    let hash = 0;
    for (let i = 0; i < (nombre || '').length; i++) hash += nombre.charCodeAt(i);
    return colors[hash % colors.length];
  };

  // Exportar listado
  const handleExport = () => {
    const headers = ['ID', 'Cliente', 'Cédula', 'Fecha', 'Total', 'Saldo Pendiente', 'Método', 'Estado'];
    const rows = filteredOrders.map((o) => [
      `PED${String(o.id_pedido).padStart(3, '0')}`,
      `"${o.nombre_cliente || ''}"`,
      `"${o.cedula_cliente || 'N/A'}"`,
      `"${o.fecha_pedido ? new Date(o.fecha_pedido).toLocaleDateString('es-CO') : ''}"`,
      o.total,
      o.saldo_pendiente ?? o.total,
      o.metodo_pago,
      o.nombre_estado
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pedidos_pendientes_prigma_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Si está activo el modo POS, renderizar POSView
  if (isPOSOpen) {
    return (
      <POSView
        currentUser={currentUser}
        onBackToOrders={() => {
          setIsPOSOpen(false);
          if (onNavigateBack) onNavigateBack();
        }}
      />
    );
  }

  const selectedProdObj = catalog.productos.find((p) => p.id_producto === Number(selectedProductId));

  return (
    <div className="space-y-6">
      {/* Cabecera del módulo de Pedidos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-black text-xl text-foreground">Pedidos Pendientes</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {pendingOrders.length} en curso
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pedidos abiertos para añadir productos o completar la venta (las ventas completadas se gestionan en el módulo de Ventas).
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl font-bold text-foreground text-xs bg-card border border-border hover:bg-muted transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <FileDown className="w-4 h-4 text-muted-foreground" />
            Exportar
          </button>
          <button
            onClick={() => setIsPOSOpen(true)}
            className="px-4 py-2.5 rounded-xl font-black text-white text-xs bg-primary hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Pedido
          </button>
        </div>
      </div>

      {/* Barra de Filtros: Buscador */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nombre de cliente, cédula o código PED..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all shadow-xs"
        />
      </div>

      {/* Tabla Principal de Pedidos Pendientes */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Cliente / Cédula</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4 text-center">Artículos</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Saldo Pendiente</th>
                <th className="py-3.5 px-4">Método</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <span className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                    Cargando pedidos pendientes...
                  </td>
                </tr>
              ) : pagedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-foreground">No hay pedidos pendientes</p>
                    <p className="text-xs">Todos los pedidos se encuentran completados o no coinciden con la búsqueda.</p>
                  </td>
                </tr>
              ) : (
                pagedOrders.map((order) => {
                  const idStr = `PED${String(order.id_pedido).padStart(3, '0')}`;
                  const fechaStr = order.fecha_pedido
                    ? new Date(order.fecha_pedido).toLocaleDateString('es-CO')
                    : '—';
                  const horaStr = order.fecha_pedido
                    ? new Date(order.fecha_pedido).toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '';
                  const initials = getInitials(order.nombre_cliente);
                  const avatarColor = getAvatarColor(order.nombre_cliente);
                  const itemsCount =
                    order.detalles?.productos?.reduce((s, p) => s + (p.cantidad || 1), 0) +
                    (order.detalles?.servicios?.reduce((s, p) => s + (p.cantidad || 1), 0) || 0) ||
                    order.total_articulos || 1;

                  return (
                    <tr
                      key={order.id_pedido}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {/* ID del Pedido */}
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-primary">
                        {idStr}
                      </td>

                      {/* Cliente y Cédula con Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${avatarColor}`}
                          >
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-xs">
                              {order.nombre_cliente}
                            </span>
                            {order.cedula_cliente ? (
                              <span className="text-[10px] font-mono text-muted-foreground">
                                CC: {order.cedula_cliente}
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">
                                Sin documento
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Fecha y Hora */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-foreground">{fechaStr}</div>
                        <div className="text-[10px] text-muted-foreground">{horaStr}</div>
                      </td>

                      {/* Artículos */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border/60">
                          {itemsCount} ítem(s)
                        </span>
                      </td>

                      {/* Total en COP */}
                      <td className="py-3.5 px-4 font-mono font-black text-xs text-foreground">
                        {formatCOP(order.total)}
                      </td>

                      {/* Saldo Pendiente */}
                      <td className="py-3.5 px-4 font-mono font-black text-xs text-amber-600 dark:text-amber-400">
                        {formatCOP(order.saldo_pendiente ?? order.total)}
                      </td>

                      {/* Método de Pago */}
                      <td className="py-3.5 px-4 text-foreground font-medium text-xs">
                        {order.metodo_pago || 'Efectivo'}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status="Pendiente" />
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Añadir Producto al pedido pendiente */}
                          <button
                            onClick={() => handleOpenAddProduct(order)}
                            className="px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                            title="Añadir Producto o Servicio a este Pedido"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            <span>Añadir</span>
                          </button>

                          {/* Completar Venta */}
                          <button
                            onClick={() => handleOpenCompleteModal(order)}
                            className="px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                            title="Completar Venta (Pasa al módulo de Ventas)"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completar</span>
                          </button>

                          {/* Ver Detalle */}
                          <button
                            onClick={() => setSelectedOrderForDetail(order)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                            title="Ver Detalle del Pedido"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Imprimir Ticket */}
                          <button
                            onClick={() => printTicket(order)}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-950/40 transition-colors cursor-pointer"
                            title="Imprimir Comprobante"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Eliminar Pedido (Admin total power) */}
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="p-1.5 rounded-lg text-destructive hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Eliminar Pedido (Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Paginación */}
        <div className="p-4 border-t border-border">
          <Pagination page={page} total={totalPages} onPage={setPage} />
        </div>
      </div>

      {/* MODAL 1: AÑADIR PRODUCTO A PEDIDO PENDIENTE */}
      <Modal
        open={Boolean(orderToAddProd)}
        onClose={() => setOrderToAddProd(null)}
        title={`Añadir Producto a Pedido PED${String(orderToAddProd?.id_pedido || '').padStart(3, '0')}`}
      >
        <form onSubmit={handleConfirmAddProduct} className="space-y-4 text-xs">
          <div className="p-3 bg-muted/40 rounded-xl border border-border">
            <span className="text-muted-foreground block text-[11px]">Cliente del Pedido:</span>
            <p className="font-bold text-foreground text-sm">{orderToAddProd?.nombre_cliente}</p>
            <p className="text-muted-foreground text-[11px]">Total Actual: <strong className="font-mono text-primary">{formatCOP(orderToAddProd?.total || 0)}</strong></p>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">
              Seleccionar Producto del Inventario <span className="text-primary">*</span>
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setAddQuantity(1);
              }}
              required
              className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-ring cursor-pointer transition-all"
            >
              {catalog.productos.map((prod) => (
                <option key={prod.id_producto} value={prod.id_producto}>
                  {prod.nombre_producto} · {formatCOP(prod.precio_venta)} (Stock: {prod.stock})
                </option>
              ))}
            </select>
          </div>

          {selectedProdObj && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Categoría:</span>
                <span className="font-bold text-foreground">{selectedProdObj.nombre_categoria || 'Varios'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stock Disponible:</span>
                <span className="font-mono font-bold text-foreground">{selectedProdObj.stock} unidades</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Precio Unitario:</span>
                <span className="font-mono font-bold text-primary">{formatCOP(selectedProdObj.precio_venta)}</span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">
              Cantidad a Agregar <span className="text-primary">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={selectedProdObj?.stock || 999}
              value={addQuantity}
              onChange={(e) => setAddQuantity(Math.max(1, Number(e.target.value)))}
              required
              className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-mono font-bold text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="bg-muted/40 p-3 rounded-xl border border-border flex justify-between items-center text-sm font-bold">
            <span>Subtotal Adicional:</span>
            <span className="font-mono text-primary font-black text-base">
              {formatCOP((selectedProdObj?.precio_venta || 0) * addQuantity)}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setOrderToAddProd(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-foreground bg-muted hover:bg-muted/80 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmittingAction || !selectedProdObj || selectedProdObj.stock <= 0}
              className="px-4 py-2 rounded-xl text-xs font-black text-white bg-primary hover:opacity-90 active:scale-[0.98] cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50"
            >
              {isSubmittingAction ? 'Agregando...' : 'Confirmar y Descontar Stock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: COMPLETAR VENTA (PASAR A VENTAS) */}
      <Modal
        open={Boolean(orderToComplete)}
        onClose={() => setOrderToComplete(null)}
        title={`Completar Venta PED${String(orderToComplete?.id_pedido || '').padStart(3, '0')}`}
      >
        <form onSubmit={handleConfirmCompleteOrder} className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
            <span className="text-emerald-800 dark:text-emerald-300 font-bold block">
              ¡Esta operación liquidará el pedido y lo trasladará al módulo de Ventas!
            </span>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Cliente: <strong>{orderToComplete?.nombre_cliente}</strong>
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Total a Liquidar:{' '}
              <strong className="font-mono text-sm">{formatCOP(orderToComplete?.total || 0)}</strong>
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">Método de Pago Final</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Efectivo', icon: Banknote },
                { id: 'Transferencia', icon: CreditCard }
              ].map((mp) => (
                <button
                  type="button"
                  key={mp.id}
                  onClick={() => setCompletePaymentMethod(mp.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    completePaymentMethod === mp.id
                      ? 'bg-secondary text-secondary-foreground border-primary/40 shadow-xs'
                      : 'bg-background border-border text-foreground hover:bg-muted'
                  }`}
                >
                  <mp.icon className="w-4 h-4" />
                  {mp.id}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setOrderToComplete(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-foreground bg-muted hover:bg-muted/80 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmittingAction}
              className="px-4 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {isSubmittingAction ? 'Procesando...' : '✓ Confirmar Venta'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Detalle */}
      <OrderDetailModal
        open={Boolean(selectedOrderForDetail)}
        onClose={() => setSelectedOrderForDetail(null)}
        order={selectedOrderForDetail}
      />

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
