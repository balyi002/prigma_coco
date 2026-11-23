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
  BookmarkCheck,
  DollarSign,
  AlertCircle,
  Receipt
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
  const [filterStatus, setFilterStatus] = useState('Todos'); // 'Todos', 'Apartado', 'Pendiente'
  const [page, setPage] = useState(1);
  const [isPOSOpen, setIsPOSOpen] = useState(defaultToPOS);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', onConfirm: null });

  // Modales de acciones
  const [orderToAddProd, setOrderToAddProd] = useState(null);
  const [orderToComplete, setOrderToComplete] = useState(null);
  const [orderToAbonar, setOrderToAbonar] = useState(null);

  // Estados de formularios en modales
  const [catalog, setCatalog] = useState({ productos: [], servicios: [] });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [addQuantity, setAddQuantity] = useState(1);
  const [completePaymentMethod, setCompletePaymentMethod] = useState('Efectivo');
  const [montoAbonoInput, setMontoAbonoInput] = useState('');
  const [metodoAbonoInput, setMetodoAbonoInput] = useState('Efectivo');
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

  // REGLA DEL MODELO RELACIONAL: Pedidos abiertos = Apartado o Pendiente (fn_estado_abierto)
  const openOrders = useMemo(() => {
    return orders.filter((o) => {
      const st = (o.nombre_estado || '').toLowerCase();
      return st === 'apartado' || st === 'pendiente';
    });
  }, [orders]);

  // Contadores de métricas
  const totalApartados = useMemo(
    () => openOrders.filter((o) => (o.nombre_estado || '').toLowerCase() === 'apartado').length,
    [openOrders]
  );
  const totalPendientes = useMemo(
    () => openOrders.filter((o) => (o.nombre_estado || '').toLowerCase() === 'pendiente').length,
    [openOrders]
  );

  // Filtrado por buscador y estado
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return openOrders.filter((o) => {
      const st = (o.nombre_estado || '').toLowerCase();
      const matchStatus =
        filterStatus === 'Todos' ||
        st === filterStatus.toLowerCase();

      const idStr = `PED${String(o.id_pedido).padStart(3, '0')}`.toLowerCase();
      const matchName = o.nombre_cliente && o.nombre_cliente.toLowerCase().includes(q);
      const matchCedula = o.cedula_cliente && String(o.cedula_cliente).toLowerCase().includes(q);
      const matchId = idStr.includes(q);

      return matchStatus && (matchName || matchCedula || matchId);
    });
  }, [openOrders, filterStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const pagedOrders = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, page]);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setPage(1);
  }, [filterStatus, search]);

  // Modal: Registrar Abono a Pedido / Apartado
  const handleOpenAbonarModal = (order) => {
    const saldo = Number(order.saldo_pendiente ?? (order.total - (order.abono || 0)));
    setOrderToAbonar(order);
    setMontoAbonoInput(String(saldo));
    setMetodoAbonoInput('Efectivo');
  };

  const handleConfirmAbono = async (e) => {
    e.preventDefault();
    if (!orderToAbonar) return;

    const monto = Number(montoAbonoInput);
    const saldoActual = Number(orderToAbonar.saldo_pendiente ?? (orderToAbonar.total - (orderToAbonar.abono || 0)));

    if (!monto || monto <= 0) {
      alert('Por favor ingresa un monto válido mayor a cero.');
      return;
    }
    if (monto > saldoActual) {
      alert(`El abono ($ ${monto}) no puede superar el saldo pendiente ($ ${saldoActual}).`);
      return;
    }

    setIsSubmittingAction(true);
    try {
      await orderService.addPaymentToOrder(orderToAbonar.id_pedido, {
        monto,
        metodo: metodoAbonoInput
      });
      await fetchOrders();
      setOrderToAbonar(null);
    } catch (err) {
      console.error('Error registrando abono:', err);
      alert(err.response?.data?.error || err.message || 'Error al registrar abono');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Modal: Completar Venta (pasa a Completado y se traslada a Ventas)
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
      await fetchOrders();
      setOrderToComplete(null);
    } catch (err) {
      console.error('Error completando venta:', err);
      alert(err.response?.data?.error || err.message || 'Error al completar la venta');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Modal: Añadir Producto a Pedido Abierto
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

  // Eliminar pedido (Permiso total del Administrador)
  const handleDeleteOrder = (order) => {
    const idFormatted = `PED${String(order.id_pedido).padStart(3, '0')}`;
    const esApartado = (order.nombre_estado || '').toLowerCase() === 'apartado';

    setConfirmState({
      open: true,
      title: `¿Eliminar pedido ${idFormatted} (${order.nombre_estado})?`,
      message: `Como Administrador tienes control total. ${
        esApartado
          ? 'La mercancía reservada en este apartado será reintegrada automáticamente al inventario según el trigger SQL (trg_pedidos_au).'
          : 'El pedido será eliminado del sistema de forma permanente.'
      }`,
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
      'bg-purple-600 text-white',
      'bg-indigo-600 text-white',
      'bg-pink-600 text-white',
      'bg-emerald-600 text-white',
      'bg-amber-600 text-white'
    ];
    let hash = 0;
    for (let i = 0; i < (nombre || '').length; i++) hash += nombre.charCodeAt(i);
    return colors[hash % colors.length];
  };

  // Exportar listado
  const handleExport = () => {
    const headers = ['ID', 'Cliente', 'Cédula', 'Fecha', 'Total', 'Abonado', 'Saldo Pendiente', 'Método', 'Estado'];
    const rows = filteredOrders.map((o) => [
      `PED${String(o.id_pedido).padStart(3, '0')}`,
      `"${o.nombre_cliente || ''}"`,
      `"${o.cedula_cliente || 'N/A'}"`,
      `"${o.fecha_pedido ? new Date(o.fecha_pedido).toLocaleDateString('es-CO') : ''}"`,
      o.total,
      o.abono || 0,
      o.saldo_pendiente ?? (o.total - (o.abono || 0)),
      o.metodo_pago,
      o.nombre_estado
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pedidos_activos_prigma_${new Date().toISOString().slice(0, 10)}.csv`);
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
          <div className="flex items-center gap-2.5">
            <h1 className="font-black text-xl text-foreground">Gestión de Pedidos</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
              {openOrders.length} activos
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Control de pedidos en estado <strong>Pendiente</strong> y <strong>Apartado</strong> (con reserva de stock y abonos parciales). Las ventas completadas se gestionan en Ventas.
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
            Nuevo Pedido / POS
          </button>
        </div>
      </div>

      {/* Pestañas de Filtro Rápido para Destacar Apartados y Pendientes */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setFilterStatus('Todos')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterStatus === 'Todos'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          <span>Todos los Activos</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterStatus === 'Todos' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
            {openOrders.length}
          </span>
        </button>

        {/* PESTAÑA DESTACADA: APARTADOS */}
        <button
          onClick={() => setFilterStatus('Apartado')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            filterStatus === 'Apartado'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50'
          }`}
        >
          <BookmarkCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300" />
          <span>Apartados (Plan Separe)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-700 text-white font-mono">
            {totalApartados}
          </span>
        </button>

        {/* PESTAÑA DESTACADA: PENDIENTES */}
        <button
          onClick={() => setFilterStatus('Pendiente')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterStatus === 'Pendiente'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
          <span>Pendientes</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-700 text-white font-mono">
            {totalPendientes}
          </span>
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar pedido por cliente, cédula o código PED..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all shadow-xs"
        />
      </div>

      {/* Tabla Principal de Pedidos Abiertos */}
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
                <th className="py-3.5 px-4">Abono / Saldo</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <span className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                    Cargando pedidos...
                  </td>
                </tr>
              ) : pagedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-foreground">No se encontraron pedidos en esta vista</p>
                    <p className="text-xs">Usa el botón "+ Nuevo Pedido / POS" para registrar un nuevo pedido o apartado.</p>
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
                  const isApartado = (order.nombre_estado || '').toLowerCase() === 'apartado';
                  
                  const totalNum = Number(order.total || 0);
                  const abonoNum = Number(order.abono || 0);
                  const saldoNum = Number(order.saldo_pendiente ?? Math.max(0, totalNum - abonoNum));
                  const porcentajeAbono = totalNum > 0 ? Math.min(100, Math.round((abonoNum / totalNum) * 100)) : 0;
                  const isLiquidado = saldoNum <= 0;

                  const itemsCount =
                    order.detalles?.productos?.reduce((s, p) => s + (p.cantidad || 1), 0) +
                    (order.detalles?.servicios?.reduce((s, p) => s + (p.cantidad || 1), 0) || 0) ||
                    order.total_articulos || 1;

                  return (
                    <tr
                      key={order.id_pedido}
                      className={`hover:bg-muted/20 transition-colors ${
                        isApartado ? 'bg-purple-500/[0.02] dark:bg-purple-950/10' : ''
                      }`}
                    >
                      {/* ID del Pedido */}
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-primary">
                        {idStr}
                      </td>

                      {/* Cliente y Cédula */}
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

                      {/* Total */}
                      <td className="py-3.5 px-4 font-mono font-black text-xs text-foreground">
                        {formatCOP(totalNum)}
                      </td>

                      {/* Abono y Saldo Destacado (Especial para Apartados) */}
                      <td className="py-3.5 px-4 min-w-[170px]">
                        {isApartado ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold">
                              <span className="text-purple-700 dark:text-purple-300 font-bold">
                                Abono: {formatCOP(abonoNum)}
                              </span>
                              <span className="font-mono text-muted-foreground">{porcentajeAbono}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isLiquidado ? 'bg-emerald-500' : 'bg-purple-600'
                                }`}
                                style={{ width: `${porcentajeAbono}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[11px] font-mono font-bold">
                              <span className="text-muted-foreground text-[10px]">Saldo:</span>
                              <span className={isLiquidado ? 'text-emerald-600 font-bold' : 'text-purple-700 dark:text-purple-300'}>
                                {isLiquidado ? '¡Pagado!' : formatCOP(saldoNum)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="font-mono text-xs">
                            <span className="text-muted-foreground text-[10px] block">Saldo:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              {formatCOP(saldoNum)}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Estado con Badge Destacado */}
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={order.nombre_estado} />
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Botón Abonar para Apartados con saldo pendiente */}
                          {isApartado && !isLiquidado && (
                            <button
                              onClick={() => handleOpenAbonarModal(order)}
                              className="px-2 py-1 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white dark:bg-purple-950/60 dark:text-purple-300 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                              title="Registrar Abono a este Apartado"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Abonar</span>
                            </button>
                          )}

                          {/* Añadir Producto al pedido o apartado */}
                          <button
                            onClick={() => handleOpenAddProduct(order)}
                            className="px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                            title="Añadir Producto o Servicio (reserva stock)"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            <span>Añadir</span>
                          </button>

                          {/* Completar Venta */}
                          <button
                            onClick={() => handleOpenCompleteModal(order)}
                            className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                              isLiquidado
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 animate-pulse'
                                : 'bg-emerald-600/90 text-white hover:bg-emerald-700'
                            }`}
                            title={isLiquidado ? '¡Listo para entregar y pasar a Ventas!' : 'Liquidar y completar venta'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completar</span>
                          </button>

                          {/* Ver Detalle */}
                          <button
                            onClick={() => setSelectedOrderForDetail(order)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                            title="Ver Detalle Completo"
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

                          {/* Eliminar Pedido (Admin) */}
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

      {/* MODAL 1: REGISTRAR ABONO (Especial para Apartados y pedidos abiertos) */}
      <Modal
        open={Boolean(orderToAbonar)}
        onClose={() => setOrderToAbonar(null)}
        title={`Registrar Abono — Pedido PED${String(orderToAbonar?.id_pedido || '').padStart(3, '0')}`}
      >
        <form onSubmit={handleConfirmAbono} className="space-y-4 text-xs">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-purple-800 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5">
                <BookmarkCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Apartado: {orderToAbonar?.nombre_cliente}
              </span>
              <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300">
                Total: {formatCOP(orderToAbonar?.total || 0)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-purple-200 dark:border-purple-800 text-[11px]">
              <div>
                <span className="text-muted-foreground">Abonado hasta hoy:</span>
                <p className="font-mono font-bold text-foreground">{formatCOP(orderToAbonar?.abono || 0)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Saldo Restante:</span>
                <p className="font-mono font-bold text-purple-700 dark:text-purple-300 text-sm">
                  {formatCOP(orderToAbonar?.saldo_pendiente ?? (orderToAbonar?.total - (orderToAbonar?.abono || 0)))}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">
              Monto a Abonar ($ COP) <span className="text-primary">*</span>
            </label>
            <input
              type="number"
              min="500"
              max={orderToAbonar?.saldo_pendiente ?? (orderToAbonar?.total - (orderToAbonar?.abono || 0))}
              value={montoAbonoInput}
              onChange={(e) => setMontoAbonoInput(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-base font-mono font-black text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">Método de Pago del Abono</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Efectivo', icon: Banknote },
                { id: 'Transferencia', icon: CreditCard }
              ].map((mp) => (
                <button
                  type="button"
                  key={mp.id}
                  onClick={() => setMetodoAbonoInput(mp.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    metodoAbonoInput === mp.id
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
              onClick={() => setOrderToAbonar(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-foreground bg-muted hover:bg-muted/80 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmittingAction}
              className="px-4 py-2 rounded-xl text-xs font-black text-white bg-purple-600 hover:bg-purple-700 cursor-pointer shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              {isSubmittingAction ? 'Registrando...' : 'Confirmar Abono'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: AÑADIR PRODUCTO A PEDIDO */}
      <Modal
        open={Boolean(orderToAddProd)}
        onClose={() => setOrderToAddProd(null)}
        title={`Añadir Producto — Pedido PED${String(orderToAddProd?.id_pedido || '').padStart(3, '0')}`}
      >
        <form onSubmit={handleConfirmAddProduct} className="space-y-4 text-xs">
          <div className="p-3 bg-muted/40 rounded-xl border border-border">
            <span className="text-muted-foreground block text-[11px]">Cliente del Pedido:</span>
            <p className="font-bold text-foreground text-sm">{orderToAddProd?.nombre_cliente}</p>
            <p className="text-muted-foreground text-[11px]">
              Total Actual: <strong className="font-mono text-primary">{formatCOP(orderToAddProd?.total || 0)}</strong>
            </p>
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
                <span className="text-muted-foreground">Stock Físico Disponible:</span>
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

      {/* MODAL 3: COMPLETAR VENTA (PASAR A VENTAS) */}
      <Modal
        open={Boolean(orderToComplete)}
        onClose={() => setOrderToComplete(null)}
        title={`Completar Venta — Pedido PED${String(orderToComplete?.id_pedido || '').padStart(3, '0')}`}
      >
        <form onSubmit={handleConfirmCompleteOrder} className="space-y-4 text-xs">
          {Number(orderToComplete?.saldo_pendiente ?? (orderToComplete?.total - (orderToComplete?.abono || 0))) > 0 ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1">
              <span className="text-amber-800 dark:text-amber-300 font-bold block flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Liquidación Final de Saldo Pendiente
              </span>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Para pasar este pedido a <strong>Completado</strong> (Ventas), según la regla de base de datos el saldo restante debe quedar en 0.
              </p>
              <div className="pt-1 flex justify-between font-bold text-xs text-amber-900 dark:text-amber-200">
                <span>Saldo a Liquidar:</span>
                <span className="font-mono text-sm font-black">
                  {formatCOP(orderToComplete?.saldo_pendiente ?? (orderToComplete?.total - (orderToComplete?.abono || 0)))}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
              <span className="text-emerald-800 dark:text-emerald-300 font-bold block flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ¡El saldo está totalmente cubierto!
              </span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Al confirmar, el pedido cambiará a estado <strong>Completado</strong> y se visualizará en el módulo de Ventas.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">Método de Pago para Liquidación</label>
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
              {isSubmittingAction ? 'Procesando...' : '✓ Confirmar y Facturar Venta'}
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
