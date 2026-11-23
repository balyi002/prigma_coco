import { INITIAL_MOCK_DATA, ALL_PERMISOS_PRIVILEGIOS } from './mockData';

const STORAGE_KEY = 'prigma_mock_db';
const ROLES_PERMS_KEY = 'prigma_mock_roles_perms';

// Inicializar base de datos en localStorage o memoria
function loadDatabase() {
  let loaded = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      loaded = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error leyendo mock storage:', e);
  }
  const initial = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
  if (!loaded) {
    saveDatabase(initial);
    return initial;
  }
  // Asegurar sincronización exacta con la estructura de colecciones
  let changed = false;
  for (const key of Object.keys(loaded)) {
    if (!(key in initial)) {
      delete loaded[key];
      changed = true;
    }
  }
  for (const key of Object.keys(initial)) {
    if (!loaded[key]) {
      loaded[key] = initial[key];
      changed = true;
    }
  }

  // Sincronizar pedidos iniciales para reflejar estado Apartado
  if (loaded.pedidos) {
    const p2 = loaded.pedidos.find((p) => p.id_pedido === 2);
    if (p2 && p2.nombre_estado === 'Pendiente') {
      p2.id_estado = 1;
      p2.nombre_estado = 'Apartado';
      changed = true;
    }
    if (!loaded.pedidos.some((p) => p.id_pedido === 6)) {
      const p6 = initial.pedidos?.find((p) => p.id_pedido === 6);
      if (p6) {
        loaded.pedidos.push(p6);
        changed = true;
      }
    }
  }
  if (changed) saveDatabase(loaded);
  return loaded;
}

function saveDatabase(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn('Error guardando mock storage:', e);
  }
}

// Inicializar asignaciones de permisos para roles
function loadRolesPerms() {
  try {
    const raw = localStorage.getItem(ROLES_PERMS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error leyendo permisos de roles:', e);
  }

  // Generación inicial de permisos por rol
  // Rol 1: Admin -> Todos los 70 activos
  const adminPerms = ALL_PERMISOS_PRIVILEGIOS.map((pp) => ({
    ...pp,
    estado_permiso: 1
  }));

  // Rol 2: Vendedor -> Permisos de ventas, catálogo, clientes, pedidos, dashboard
  const vendedorAllowed = ['Dashboard', 'Categoría de Productos', 'Gestión de Productos', 'Pedidos', 'Clientes', 'Ventas'];
  const vendedorPerms = ALL_PERMISOS_PRIVILEGIOS.map((pp) => ({
    ...pp,
    estado_permiso: vendedorAllowed.includes(pp.nombre_permiso) ? 1 : 0
  }));

  // Rol 3: Operador de Servicios -> Servicios, Categoría de Servicios, Agenda, Empleados, Dashboard
  const operadorAllowed = ['Dashboard', 'Categoría de Servicios', 'Gestión de Servicios', 'Empleados', 'Agenda', 'Pedidos'];
  const operadorPerms = ALL_PERMISOS_PRIVILEGIOS.map((pp) => ({
    ...pp,
    estado_permiso: operadorAllowed.includes(pp.nombre_permiso) ? 1 : 0
  }));

  const initialRolesPerms = {
    1: adminPerms,
    2: vendedorPerms,
    3: operadorPerms
  };

  try {
    localStorage.setItem(ROLES_PERMS_KEY, JSON.stringify(initialRolesPerms));
  } catch (e) {
    console.warn('Error guardando permisos iniciales:', e);
  }

  return initialRolesPerms;
}

function saveRolesPerms(perms) {
  try {
    localStorage.setItem(ROLES_PERMS_KEY, JSON.stringify(perms));
  } catch (e) {
    console.warn('Error guardando permisos de roles:', e);
  }
}

let db = loadDatabase();
let rolesPerms = loadRolesPerms();

// Helper para respuestas simuladas con estructura tipo Axios { data: ... }
function ok(data) {
  return Promise.resolve({ data: JSON.parse(JSON.stringify(data)), status: 200, statusText: 'OK' });
}

// Función central para interceptar solicitudes a la API y responder con datos quemados
export async function mockRequest(method, rawPath, body = null) {
  // Simular pequeña latencia de render (20ms) para transiciones fluidas
  await new Promise((r) => setTimeout(r, 20));

  // Normalizar ruta sin query params para el enrutamiento base
  const [pathWithSlash, queryString] = rawPath.split('?');
  const path = pathWithSlash.startsWith('/') ? pathWithSlash : `/${pathWithSlash}`;
  const m = method.toUpperCase();

  // ---------------- AUTH ----------------
  if (path === '/login' && m === 'POST') {
    const doc = String(body?.documento || '').trim();
    // Buscar usuario por documento o usar el primer admin disponible
    const user = db.usuarios.find((u) => String(u.documento) === doc) || db.usuarios[0];
    return ok({
      mensaje: 'Autenticación exitosa (Mock PRIGMA)',
      usuario: {
        id_usuario: user.id_usuario,
        nombre_usuario: user.nombre_usuario,
        apellido_usuario: user.apellido_usuario,
        documento: user.documento,
        id_rol: user.id_rol,
        nombre_rol: user.nombre_rol
      }
    });
  }

  // ---------------- USUARIOS ----------------
  if (path === '/usuarios' && m === 'GET') {
    return ok(db.usuarios);
  }

  if (path === '/usuarios' && m === 'POST') {
    const newId = (db.usuarios.reduce((max, u) => Math.max(max, u.id_usuario), 0) || 0) + 1;
    const rol = db.roles.find((r) => r.id_rol === Number(body.id_rol));
    const tipoDoc = db.tiposDocumento.find((t) => t.id_tipo_documento === Number(body.id_tipo_documento));

    const nuevoUsuario = {
      id_usuario: newId,
      nombre_usuario: body.nombre_usuario,
      apellido_usuario: body.apellido_usuario,
      id_tipo_documento: Number(body.id_tipo_documento) || 1,
      tipo_documento: tipoDoc?.abreviatura || 'CC',
      documento: body.documento,
      telefono: body.telefono || '',
      id_rol: Number(body.id_rol) || 2,
      nombre_rol: rol?.nombre_rol || 'Vendedor',
      estado: 1,
      fecha_creacion: new Date().toISOString()
    };
    db.usuarios.push(nuevoUsuario);
    saveDatabase(db);
    return ok({ message: 'Usuario creado con éxito', id_usuario: newId });
  }

  const matchUserStatus = path.match(/^\/usuarios\/(\d+)\/estado$/);
  if (matchUserStatus && m === 'PATCH') {
    const id = Number(matchUserStatus[1]);
    const user = db.usuarios.find((u) => u.id_usuario === id);
    if (user) {
      user.estado = body.estado !== undefined ? (body.estado ? 1 : 0) : (user.estado ? 0 : 1);
      saveDatabase(db);
    }
    return ok({ message: 'Estado del usuario actualizado' });
  }

  const matchUser = path.match(/^\/usuarios\/(\d+)$/);
  if (matchUser && m === 'PUT') {
    const id = Number(matchUser[1]);
    const user = db.usuarios.find((u) => u.id_usuario === id);
    if (user) {
      const rol = db.roles.find((r) => r.id_rol === Number(body.id_rol));
      const tipoDoc = db.tiposDocumento.find((t) => t.id_tipo_documento === Number(body.id_tipo_documento));
      Object.assign(user, {
        nombre_usuario: body.nombre_usuario ?? user.nombre_usuario,
        apellido_usuario: body.apellido_usuario ?? user.apellido_usuario,
        id_tipo_documento: Number(body.id_tipo_documento) || user.id_tipo_documento,
        tipo_documento: tipoDoc?.abreviatura || user.tipo_documento,
        documento: body.documento ?? user.documento,
        telefono: body.telefono ?? user.telefono,
        id_rol: Number(body.id_rol) || user.id_rol,
        nombre_rol: rol?.nombre_rol || user.nombre_rol
      });
      saveDatabase(db);
    }
    return ok({ message: 'Usuario actualizado con éxito' });
  }

  if (matchUser && m === 'DELETE') {
    const id = Number(matchUser[1]);
    db.usuarios = db.usuarios.filter((u) => u.id_usuario !== id);
    saveDatabase(db);
    return ok({ message: 'Usuario eliminado' });
  }

  // ---------------- TIPOS DE DOCUMENTO ----------------
  if (path === '/tipos-documento' && m === 'GET') {
    return ok(db.tiposDocumento);
  }

  // ---------------- ROLES Y PERMISOS ----------------
  if (path === '/roles' && m === 'GET') {
    return ok(db.roles);
  }

  if (path === '/roles' && m === 'POST') {
    const newId = (db.roles.reduce((max, r) => Math.max(max, r.id_rol), 0) || 0) + 1;
    const nuevoRol = {
      id_rol: newId,
      nombre_rol: body.nombre_rol,
      descripcion: body.descripcion || '',
      estado: 1
    };
    db.roles.push(nuevoRol);
    saveDatabase(db);

    // Asignar permisos si se proporcionaron
    if (body.asignaciones) {
      rolesPerms[newId] = ALL_PERMISOS_PRIVILEGIOS.map((pp) => ({
        ...pp,
        estado_permiso: body.asignaciones[pp.id_permiso_privilegio] ? 1 : 0
      }));
      saveRolesPerms(rolesPerms);
    }
    return ok({ message: 'Rol creado con éxito', id_rol: newId });
  }

  const matchRoleStatus = path.match(/^\/roles\/(\d+)\/estado$/);
  if (matchRoleStatus && m === 'PATCH') {
    const id = Number(matchRoleStatus[1]);
    const role = db.roles.find((r) => r.id_rol === id);
    if (role) {
      role.estado = body.estado !== undefined ? (body.estado ? 1 : 0) : (role.estado ? 0 : 1);
      saveDatabase(db);
    }
    return ok({ message: 'Estado del rol actualizado' });
  }

  const matchRolePerms = path.match(/^\/roles\/(\d+)\/permisos$/);
  if (matchRolePerms && m === 'GET') {
    const id = Number(matchRolePerms[1]);
    const perms = rolesPerms[id] || ALL_PERMISOS_PRIVILEGIOS.map((pp) => ({ ...pp, estado_permiso: 0 }));
    return ok(perms);
  }

  if (matchRolePerms && m === 'PUT') {
    const id = Number(matchRolePerms[1]);
    const asignaciones = body.asignaciones || {};
    rolesPerms[id] = ALL_PERMISOS_PRIVILEGIOS.map((pp) => ({
      ...pp,
      estado_permiso: asignaciones[pp.id_permiso_privilegio] ? 1 : 0
    }));
    saveRolesPerms(rolesPerms);
    return ok({ message: 'Permisos actualizados con éxito' });
  }

  const matchRole = path.match(/^\/roles\/(\d+)$/);
  if (matchRole && m === 'PUT') {
    const id = Number(matchRole[1]);
    const role = db.roles.find((r) => r.id_rol === id);
    if (role) {
      role.nombre_rol = body.nombre_rol ?? role.nombre_rol;
      role.descripcion = body.descripcion ?? role.descripcion;
      saveDatabase(db);
    }
    return ok({ message: 'Rol actualizado' });
  }

  if (matchRole && m === 'DELETE') {
    const id = Number(matchRole[1]);
    db.roles = db.roles.filter((r) => r.id_rol !== id);
    delete rolesPerms[id];
    saveDatabase(db);
    saveRolesPerms(rolesPerms);
    return ok({ message: 'Rol eliminado' });
  }

  if (path === '/permisos' && m === 'GET') {
    return ok(db.permisos);
  }

  if (path === '/privilegios' && m === 'GET') {
    return ok(db.privilegios);
  }

  if (path === '/permisos-privilegios' && m === 'GET') {
    return ok(ALL_PERMISOS_PRIVILEGIOS);
  }

  // ---------------- CATEGORÍAS DE PRODUCTO ----------------
  if (path === '/categorias-producto' && m === 'GET') {
    return ok(db.categoriasProducto);
  }

  if (path === '/categorias-producto' && m === 'POST') {
    const newId = (db.categoriasProducto.reduce((max, c) => Math.max(max, c.id_categoria_producto), 0) || 0) + 1;
    const nuevaCat = {
      id_categoria_producto: newId,
      nombre_categoria: body.nombre_categoria,
      descripcion: body.descripcion || '',
      estado: 1
    };
    db.categoriasProducto.push(nuevaCat);
    saveDatabase(db);
    return ok({ message: 'Categoría creada con éxito', id_categoria_producto: newId });
  }

  const matchCatProdStatus = path.match(/^\/categorias-producto\/(\d+)\/estado$/);
  if (matchCatProdStatus && m === 'PATCH') {
    const id = Number(matchCatProdStatus[1]);
    const cat = db.categoriasProducto.find((c) => c.id_categoria_producto === id);
    if (cat) {
      cat.estado = body.estado !== undefined ? (body.estado ? 1 : 0) : (cat.estado ? 0 : 1);
      saveDatabase(db);
    }
    return ok({ message: 'Estado actualizado' });
  }

  const matchCatProd = path.match(/^\/categorias-producto\/(\d+)$/);
  if (matchCatProd && m === 'PUT') {
    const id = Number(matchCatProd[1]);
    const cat = db.categoriasProducto.find((c) => c.id_categoria_producto === id);
    if (cat) {
      cat.nombre_categoria = body.nombre_categoria ?? cat.nombre_categoria;
      cat.descripcion = body.descripcion ?? cat.descripcion;
      saveDatabase(db);
    }
    return ok({ message: 'Categoría actualizada' });
  }

  if (matchCatProd && m === 'DELETE') {
    const id = Number(matchCatProd[1]);
    db.categoriasProducto = db.categoriasProducto.filter((c) => c.id_categoria_producto !== id);
    saveDatabase(db);
    return ok({ message: 'Categoría eliminada' });
  }

  // ---------------- PRODUCTOS ----------------
  if (path === '/productos' && m === 'GET') {
    return ok(db.productos);
  }

  if (path === '/productos' && m === 'POST') {
    const newId = (db.productos.reduce((max, p) => Math.max(max, p.id_producto), 0) || 0) + 1;
    const cat = db.categoriasProducto.find((c) => c.id_categoria_producto === Number(body.id_categoria_producto));
    const nuevoProd = {
      id_producto: newId,
      nombre_producto: body.nombre_producto,
      id_categoria_producto: Number(body.id_categoria_producto),
      nombre_categoria: cat?.nombre_categoria || 'Varios',
      precio_venta: Number(body.precio_venta) || 0,
      costo: Number(body.costo) || 0,
      stock: Number(body.stock) || 0,
      stock_minimo: Number(body.stock_minimo) || 5,
      estado: 1,
      descripcion: body.descripcion || ''
    };
    db.productos.push(nuevoProd);
    saveDatabase(db);
    return ok({ message: 'Producto creado', id_producto: newId });
  }

  const matchProdStatus = path.match(/^\/productos\/(\d+)\/estado$/);
  if (matchProdStatus && m === 'PATCH') {
    const id = Number(matchProdStatus[1]);
    const prod = db.productos.find((p) => p.id_producto === id);
    if (prod) {
      prod.estado = body.estado !== undefined ? (body.estado ? 1 : 0) : (prod.estado ? 0 : 1);
      saveDatabase(db);
    }
    return ok({ message: 'Estado actualizado' });
  }

  const matchProd = path.match(/^\/productos\/(\d+)$/);
  if (matchProd && m === 'PUT') {
    const id = Number(matchProd[1]);
    const prod = db.productos.find((p) => p.id_producto === id);
    if (prod) {
      const cat = db.categoriasProducto.find((c) => c.id_categoria_producto === Number(body.id_categoria_producto));
      Object.assign(prod, {
        nombre_producto: body.nombre_producto ?? prod.nombre_producto,
        id_categoria_producto: Number(body.id_categoria_producto) || prod.id_categoria_producto,
        nombre_categoria: cat?.nombre_categoria || prod.nombre_categoria,
        precio_venta: Number(body.precio_venta) ?? prod.precio_venta,
        costo: Number(body.costo) ?? prod.costo,
        stock: Number(body.stock) ?? prod.stock,
        stock_minimo: Number(body.stock_minimo) ?? prod.stock_minimo,
        descripcion: body.descripcion ?? prod.descripcion
      });
      saveDatabase(db);
    }
    return ok({ message: 'Producto actualizado' });
  }

  if (matchProd && m === 'DELETE') {
    const id = Number(matchProd[1]);
    db.productos = db.productos.filter((p) => p.id_producto !== id);
    saveDatabase(db);
    return ok({ message: 'Producto eliminado' });
  }

  // ---------------- PROVEEDORES ----------------
  if (path === '/proveedores' && m === 'GET') {
    return ok(db.proveedores);
  }

  if (path === '/proveedores' && m === 'POST') {
    const newId = (db.proveedores.reduce((max, p) => Math.max(max, p.id_proveedor), 0) || 0) + 1;
    const tipoDoc = db.tiposDocumento.find((t) => t.id_tipo_documento === Number(body.id_tipo_documento));
    const nuevoProv = {
      id_proveedor: newId,
      nombre_proveedor: body.nombre_proveedor,
      persona_juridica: Boolean(body.persona_juridica),
      id_tipo_documento: Number(body.id_tipo_documento) || 3,
      tipo_documento: tipoDoc?.abreviatura || 'NIT',
      documento: body.documento,
      nombre_contacto: body.contacto_persona || body.nombre_contacto || '',
      contacto_persona: body.contacto_persona || body.nombre_contacto || '',
      telefono_proveedor: body.telefono_proveedor || '',
      correo_proveedor: body.correo_proveedor || '',
      direccion_proveedor: body.direccion_proveedor || '',
      estado: 1,
      categorias: body.categorias || [1, 2]
    };
    db.proveedores.push(nuevoProv);
    saveDatabase(db);
    return ok({ message: 'Proveedor creado', id_proveedor: newId });
  }

  const matchProvStatus = path.match(/^\/proveedores\/(\d+)\/estado$/);
  if (matchProvStatus && m === 'PATCH') {
    const id = Number(matchProvStatus[1]);
    const prov = db.proveedores.find((p) => p.id_proveedor === id);
    if (prov) {
      prov.estado = body.estado !== undefined ? (body.estado ? 1 : 0) : (prov.estado ? 0 : 1);
      saveDatabase(db);
    }
    return ok({ message: 'Estado actualizado' });
  }

  const matchProvCats = path.match(/^\/proveedores\/(\d+)\/categorias$/);
  if (matchProvCats && m === 'GET') {
    const id = Number(matchProvCats[1]);
    const prov = db.proveedores.find((p) => p.id_proveedor === id);
    const catIds = prov?.categorias || [1, 2];
    const cats = db.categoriasProducto.filter((c) => catIds.includes(c.id_categoria_producto));
    return ok(cats);
  }

  const matchProv = path.match(/^\/proveedores\/(\d+)$/);
  if (matchProv && m === 'PUT') {
    const id = Number(matchProv[1]);
    const prov = db.proveedores.find((p) => p.id_proveedor === id);
    if (prov) {
      const tipoDoc = db.tiposDocumento.find((t) => t.id_tipo_documento === Number(body.id_tipo_documento));
      Object.assign(prov, {
        nombre_proveedor: body.nombre_proveedor ?? prov.nombre_proveedor,
        persona_juridica: body.persona_juridica !== undefined ? Boolean(body.persona_juridica) : prov.persona_juridica,
        id_tipo_documento: Number(body.id_tipo_documento) || prov.id_tipo_documento,
        tipo_documento: tipoDoc?.abreviatura || prov.tipo_documento,
        documento: body.documento ?? prov.documento,
        nombre_contacto: body.contacto_persona ?? prov.nombre_contacto,
        contacto_persona: body.contacto_persona ?? prov.contacto_persona,
        telefono_proveedor: body.telefono_proveedor ?? prov.telefono_proveedor,
        correo_proveedor: body.correo_proveedor ?? prov.correo_proveedor,
        direccion_proveedor: body.direccion_proveedor ?? prov.direccion_proveedor
      });
      saveDatabase(db);
    }
    return ok({ message: 'Proveedor actualizado' });
  }

  if (matchProv && m === 'DELETE') {
    const id = Number(matchProv[1]);
    db.proveedores = db.proveedores.filter((p) => p.id_proveedor !== id);
    saveDatabase(db);
    return ok({ message: 'Proveedor eliminado' });
  }

  // ---------------- CATEGORÍAS DE SERVICIO ----------------
  if (path === '/categorias-servicio' && m === 'GET') {
    return ok(db.categoriasServicio);
  }

  if (path === '/categorias-servicio' && m === 'POST') {
    const newId = (db.categoriasServicio.reduce((max, c) => Math.max(max, c.id_categoria_servicio), 0) || 0) + 1;
    const nuevaCat = {
      id_categoria_servicio: newId,
      nombre_categoria: body.nombre_categoria,
      descripcion: body.descripcion || '',
      estado: 1
    };
    db.categoriasServicio.push(nuevaCat);
    saveDatabase(db);
    return ok({ message: 'Categoría de servicio creada', id_categoria_servicio: newId });
  }

  const matchCatServ = path.match(/^\/categorias-servicio\/(\d+)$/);
  if (matchCatServ && m === 'PUT') {
    const id = Number(matchCatServ[1]);
    const cat = db.categoriasServicio.find((c) => c.id_categoria_servicio === id);
    if (cat) {
      cat.nombre_categoria = body.nombre_categoria ?? cat.nombre_categoria;
      cat.descripcion = body.descripcion ?? cat.descripcion;
      saveDatabase(db);
    }
    return ok({ message: 'Categoría de servicio actualizada' });
  }

  if (matchCatServ && m === 'DELETE') {
    const id = Number(matchCatServ[1]);
    db.categoriasServicio = db.categoriasServicio.filter((c) => c.id_categoria_servicio !== id);
    saveDatabase(db);
    return ok({ message: 'Categoría de servicio eliminada' });
  }

  // ---------------- SERVICIOS ----------------
  if (path === '/servicios' && m === 'GET') {
    return ok(db.servicios);
  }

  if (path === '/servicios' && m === 'POST') {
    const newId = (db.servicios.reduce((max, s) => Math.max(max, s.id_servicio), 0) || 0) + 1;
    const cat = db.categoriasServicio.find((c) => c.id_categoria_servicio === Number(body.id_categoria_servicio));
    const nuevoServ = {
      id_servicio: newId,
      nombre_servicio: body.nombre_servicio,
      id_categoria_servicio: Number(body.id_categoria_servicio),
      nombre_categoria: cat?.nombre_categoria || 'Servicios',
      precio_venta: Number(body.precio_venta) || 0,
      costo: Number(body.costo) || 0,
      duracion_minutos: Number(body.duracion_minutos) || 5,
      estado: 1,
      descripcion: body.descripcion || ''
    };
    db.servicios.push(nuevoServ);
    saveDatabase(db);
    return ok({ message: 'Servicio creado', id_servicio: newId });
  }

  const matchServStatus = path.match(/^\/servicios\/(\d+)\/estado$/);
  if (matchServStatus && m === 'PATCH') {
    const id = Number(matchServStatus[1]);
    const serv = db.servicios.find((s) => s.id_servicio === id);
    if (serv) {
      serv.estado = body.estado !== undefined ? (body.estado ? 1 : 0) : (serv.estado ? 0 : 1);
      saveDatabase(db);
    }
    return ok({ message: 'Estado de servicio actualizado' });
  }

  const matchServ = path.match(/^\/servicios\/(\d+)$/);
  if (matchServ && m === 'PUT') {
    const id = Number(matchServ[1]);
    const serv = db.servicios.find((s) => s.id_servicio === id);
    if (serv) {
      const cat = db.categoriasServicio.find((c) => c.id_categoria_servicio === Number(body.id_categoria_servicio));
      Object.assign(serv, {
        nombre_servicio: body.nombre_servicio ?? serv.nombre_servicio,
        id_categoria_servicio: Number(body.id_categoria_servicio) || serv.id_categoria_servicio,
        nombre_categoria: cat?.nombre_categoria || serv.nombre_categoria,
        precio_venta: Number(body.precio_venta) ?? serv.precio_venta,
        costo: Number(body.costo) ?? serv.costo,
        duracion_minutos: Number(body.duracion_minutos) ?? serv.duracion_minutos,
        descripcion: body.descripcion ?? serv.descripcion
      });
      saveDatabase(db);
    }
    return ok({ message: 'Servicio actualizado' });
  }

  if (matchServ && m === 'DELETE') {
    const id = Number(matchServ[1]);
    db.servicios = db.servicios.filter((s) => s.id_servicio !== id);
    saveDatabase(db);
    return ok({ message: 'Servicio eliminado' });
  }

  // ---------------- HORARIOS / AGENDA ----------------
  if (path === '/horarios' && m === 'GET') {
    return ok(db.horarios);
  }

  if (path === '/horarios' && m === 'POST') {
    const newId = (db.horarios.reduce((max, h) => Math.max(max, h.id_horario), 0) || 0) + 1;
    const usr = db.usuarios.find((u) => u.id_usuario === Number(body.id_usuario));
    const nuevoHorario = {
      id_horario: newId,
      id_usuario: Number(body.id_usuario),
      nombre_usuario: usr?.nombre_usuario || 'Empleado',
      apellido_usuario: usr?.apellido_usuario || '',
      nombre_rol: usr?.nombre_rol || 'Turno',
      fecha_trabajo: String(body.fecha_trabajo).slice(0, 10)
    };
    db.horarios.push(nuevoHorario);
    saveDatabase(db);
    return ok({ message: 'Turno programado', id_horario: newId });
  }

  const matchHorario = path.match(/^\/horarios\/(\d+)$/);
  if (matchHorario && m === 'PUT') {
    const id = Number(matchHorario[1]);
    const hor = db.horarios.find((h) => h.id_horario === id);
    if (hor) {
      if (body.id_usuario) {
        const usr = db.usuarios.find((u) => u.id_usuario === Number(body.id_usuario));
        hor.id_usuario = Number(body.id_usuario);
        hor.nombre_usuario = usr?.nombre_usuario || hor.nombre_usuario;
        hor.apellido_usuario = usr?.apellido_usuario || hor.apellido_usuario;
        hor.nombre_rol = usr?.nombre_rol || hor.nombre_rol;
      }
      if (body.fecha_trabajo) {
        hor.fecha_trabajo = String(body.fecha_trabajo).slice(0, 10);
      }
      saveDatabase(db);
    }
    return ok({ message: 'Turno actualizado' });
  }

  if (matchHorario && m === 'DELETE') {
    const id = Number(matchHorario[1]);
    db.horarios = db.horarios.filter((h) => h.id_horario !== id);
    saveDatabase(db);
    return ok({ message: 'Turno eliminado' });
  }

  // ---------------- COMPRAS ----------------
  if (path === '/compras' && m === 'GET') {
    return ok(db.compras);
  }

  const matchCompraDetalle = path.match(/^\/compras\/(\d+)\/detalle$/);
  if (matchCompraDetalle && m === 'GET') {
    const id = Number(matchCompraDetalle[1]);
    const compra = db.compras.find((c) => c.id_compra === id);
    return ok(compra?.detalle || []);
  }

  if (path === '/compras' && m === 'POST') {
    const newId = (db.compras.reduce((max, c) => Math.max(max, c.id_compra), 0) || 0) + 1;
    const header = body.header || body;
    const lines = body.lines || [];
    const prov = db.proveedores.find((p) => p.id_proveedor === Number(header.id_proveedor));
    const cat = db.categoriasProducto.find((c) => c.id_categoria_producto === Number(header.id_categoria_producto));
    const usr = db.usuarios.find((u) => u.id_usuario === Number(header.id_usuario)) || db.usuarios[0];

    let total = 0;
    const detalleMapeado = lines.map((l, idx) => {
      const prod = db.productos.find((p) => p.id_producto === Number(l.id_producto));
      const sub = Number(l.cantidad) * Number(l.precio_unitario);
      total += sub;
      // Actualizar stock del producto
      if (prod) {
        prod.stock += Number(l.cantidad);
      }
      return {
        id_detalle_compra: newId * 100 + idx + 1,
        id_compra: newId,
        id_producto: Number(l.id_producto),
        nombre_producto: prod?.nombre_producto || 'Producto Comprado',
        cantidad: Number(l.cantidad),
        precio_unitario: Number(l.precio_unitario),
        porcentaje_descuento: Number(l.porcentaje_descuento) || 0,
        porcentaje_iva: Number(l.porcentaje_iva) || 19
      };
    });

    const nuevaCompra = {
      id_compra: newId,
      num_factura_proveedor: header.num_factura_proveedor || `FAC-${newId + 9000}`,
      id_proveedor: Number(header.id_proveedor),
      nombre_proveedor: prov?.nombre_proveedor || 'Proveedor General',
      id_categoria_producto: Number(header.id_categoria_producto),
      nombre_categoria: cat?.nombre_categoria || 'Varios',
      id_usuario: usr.id_usuario,
      nombre_usuario: `${usr.nombre_usuario} ${usr.apellido_usuario}`,
      fecha_compra: header.fecha_compra || new Date().toISOString().slice(0, 10),
      id_estado: Number(header.id_estado) || 4,
      nombre_estado: Number(header.id_estado) === 2 ? 'Pendiente' : 'Completado',
      total_compra: total || 100000,
      total_items: detalleMapeado.length,
      detalle: detalleMapeado
    };

    db.compras.unshift(nuevaCompra);
    saveDatabase(db);
    return ok({ message: 'Compra registrada con éxito', id_compra: newId });
  }

  const matchCompraStatus = path.match(/^\/compras\/(\d+)\/estado$/);
  if (matchCompraStatus && m === 'PATCH') {
    const id = Number(matchCompraStatus[1]);
    const compra = db.compras.find((c) => c.id_compra === id);
    if (compra) {
      compra.id_estado = Number(body.id_estado);
      compra.nombre_estado = compra.id_estado === 4 ? 'Completado' : compra.id_estado === 2 ? 'Pendiente' : 'Cancelado';
      saveDatabase(db);
    }
    return ok({ message: 'Estado de compra actualizado' });
  }

  const matchCompra = path.match(/^\/compras\/(\d+)$/);
  if (matchCompra && m === 'DELETE') {
    const id = Number(matchCompra[1]);
    db.compras = db.compras.filter((c) => c.id_compra !== id);
    saveDatabase(db);
    return ok({ message: 'Compra eliminada' });
  }

  // ---------------- CLIENTES ----------------
  if (path === '/clientes' && m === 'GET') {
    return ok(db.clientes);
  }

  if (path === '/clientes' && m === 'POST') {
    const newId = (db.clientes.reduce((max, c) => Math.max(max, c.id_cliente), 0) || 0) + 1;
    const nuevoCliente = {
      id_cliente: newId,
      nombre_cliente: body.nombre_cliente,
      id_tipo_documento: Number(body.id_tipo_documento) || 1,
      nombre_tipo_documento: 'CC',
      documento: body.documento || `10${String(newId).padStart(8, '0')}`,
      telefono: body.telefono || '300-000-0000',
      correo: body.correo || `${body.nombre_cliente.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      direccion: body.direccion || 'Medellín',
      estado: 1
    };
    db.clientes.push(nuevoCliente);
    saveDatabase(db);
    return ok({ message: 'Cliente registrado', id_cliente: newId });
  }

  const matchClienteStatus = path.match(/^\/clientes\/(\d+)\/estado$/);
  if (matchClienteStatus && m === 'PATCH') {
    const id = Number(matchClienteStatus[1]);
    const cliente = db.clientes.find((c) => c.id_cliente === id);
    if (cliente) {
      cliente.estado = body.estado !== undefined ? (body.estado ? 1 : 0) : (cliente.estado ? 0 : 1);
      saveDatabase(db);
    }
    return ok({ message: 'Estado del cliente actualizado' });
  }

  const matchCliente = path.match(/^\/clientes\/(\d+)$/);
  if (matchCliente && m === 'PUT') {
    const id = Number(matchCliente[1]);
    const cliente = db.clientes.find((c) => c.id_cliente === id);
    if (cliente) {
      Object.assign(cliente, {
        nombre_cliente: body.nombre_cliente ?? cliente.nombre_cliente,
        documento: body.documento ?? cliente.documento,
        telefono: body.telefono ?? cliente.telefono,
        correo: body.correo ?? cliente.correo,
        direccion: body.direccion ?? cliente.direccion
      });
      saveDatabase(db);
    }
    return ok({ message: 'Cliente actualizado' });
  }

  if (matchCliente && m === 'DELETE') {
    const id = Number(matchCliente[1]);
    db.clientes = db.clientes.filter((c) => c.id_cliente !== id);
    saveDatabase(db);
    return ok({ message: 'Cliente eliminado' });
  }

  // ---------------- ESTADOS ----------------
  if (path === '/estados' && m === 'GET') {
    return ok(db.estados);
  }

  // ---------------- PEDIDOS & POS ----------------
  if (path === '/pedidos' && m === 'GET') {
    return ok(db.pedidos);
  }

  const matchPedidoDetalle = path.match(/^\/pedidos\/(\d+)\/detalle$/);
  if (matchPedidoDetalle && m === 'GET') {
    const id = Number(matchPedidoDetalle[1]);
    const pedido = db.pedidos.find((p) => p.id_pedido === id);
    return ok(pedido?.detalles || { productos: [], servicios: [], pagos: [] });
  }

  const matchPedidoStatus = path.match(/^\/pedidos\/(\d+)\/estado$/);
  if (matchPedidoStatus && m === 'PATCH') {
    const id = Number(matchPedidoStatus[1]);
    const pedido = db.pedidos.find((p) => p.id_pedido === id);
    if (pedido) {
      pedido.id_estado = Number(body.id_estado);
      const est = db.estados.find((e) => e.id_estado === pedido.id_estado);
      pedido.nombre_estado = est?.nombre_estado || 'Completado';
      if (pedido.nombre_estado === 'Completado') {
        pedido.saldo_pendiente = 0;
        pedido.abono = pedido.total;
      }
      saveDatabase(db);
    }
    return ok({ message: 'Estado del pedido actualizado', pedido });
  }

  // Completar pedido (pasa a Completado y se liquida saldo)
  const matchPedidoCompletar = path.match(/^\/pedidos\/(\d+)\/completar$/);
  if (matchPedidoCompletar && m === 'PATCH') {
    const id = Number(matchPedidoCompletar[1]);
    const pedido = db.pedidos.find((p) => p.id_pedido === id);
    if (pedido) {
      const remainingSaldo = Number(pedido.saldo_pendiente ?? (pedido.total - (pedido.abono || 0)));
      if (!pedido.detalles) pedido.detalles = { productos: [], servicios: [], pagos: [] };
      if (!pedido.detalles.pagos) pedido.detalles.pagos = [];

      if (remainingSaldo > 0) {
        pedido.detalles.pagos.push({
          fecha: new Date().toLocaleDateString('es-CO') + ' ' + new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          monto: remainingSaldo,
          metodo: body.metodo_pago || pedido.metodo_pago || 'Efectivo'
        });
      }

      pedido.id_estado = 4;
      pedido.nombre_estado = 'Completado';
      pedido.saldo_pendiente = 0;
      pedido.abono = pedido.total;
      saveDatabase(db);
    }
    return ok({ message: 'Pedido completado con éxito', pedido });
  }

  // Registrar abono a un pedido (Apartado o Pendiente)
  const matchPedidoAbono = path.match(/^\/pedidos\/(\d+)\/abonos$/);
  if (matchPedidoAbono && m === 'POST') {
    const id = Number(matchPedidoAbono[1]);
    const pedido = db.pedidos.find((p) => p.id_pedido === id);
    if (!pedido) {
      return Promise.reject(new Error('Pedido no encontrado'));
    }
    const monto = Number(body.monto) || 0;
    const metodo = body.metodo || body.metodo_pago || 'Efectivo';
    if (monto <= 0) {
      return Promise.reject(new Error('El monto del abono debe ser mayor a cero'));
    }
    const saldoActual = Number(pedido.saldo_pendiente ?? (pedido.total - (pedido.abono || 0)));
    if (monto > saldoActual) {
      return Promise.reject(new Error('El abono no puede superar el saldo del pedido'));
    }

    pedido.abono = (Number(pedido.abono) || 0) + monto;
    pedido.saldo_pendiente = Math.max(0, saldoActual - monto);

    if (!pedido.detalles) pedido.detalles = { productos: [], servicios: [], pagos: [] };
    if (!pedido.detalles.pagos) pedido.detalles.pagos = [];
    pedido.detalles.pagos.push({
      fecha: new Date().toLocaleDateString('es-CO') + ' ' + new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      monto,
      metodo
    });

    saveDatabase(db);
    return ok({ message: 'Abono registrado con éxito', pedido });
  }

  // Añadir productos o servicios a un pedido pendiente existente
  const matchPedidoAddProd = path.match(/^\/pedidos\/(\d+)\/productos$/);
  if (matchPedidoAddProd && m === 'POST') {
    const id = Number(matchPedidoAddProd[1]);
    const pedido = db.pedidos.find((p) => p.id_pedido === id);
    if (!pedido) {
      return Promise.reject(new Error('Pedido no encontrado'));
    }

    if (!pedido.detalles) pedido.detalles = { productos: [], servicios: [], pagos: [] };
    if (!pedido.detalles.productos) pedido.detalles.productos = [];
    if (!pedido.detalles.servicios) pedido.detalles.servicios = [];

    const { id_producto, id_servicio, cantidad = 1, precio_unitario, tipo = 'Producto' } = body;
    const cantNum = Number(cantidad) || 1;

    if (tipo === 'Producto' || id_producto) {
      const prod = db.productos.find((p) => p.id_producto === Number(id_producto));
      const unitPrice = Number(precio_unitario || prod?.precio_venta || 0);
      const sub = cantNum * unitPrice;

      // Buscar si ya existe la línea en el pedido para incrementar
      const existLine = pedido.detalles.productos.find((l) => l.id_producto === Number(id_producto));
      if (existLine) {
        existLine.cantidad += cantNum;
        existLine.subtotal = existLine.cantidad * existLine.precio_unitario;
      } else {
        pedido.detalles.productos.push({
          id_producto: Number(id_producto),
          nombre_producto: prod?.nombre_producto || 'Producto Adicional',
          cantidad: cantNum,
          precio_unitario: unitPrice,
          subtotal: sub
        });
      }

      // Descontar inventario
      if (prod) {
        prod.stock = Math.max(0, prod.stock - cantNum);
      }

      pedido.total += sub;
      pedido.saldo_pendiente += sub;
      pedido.iva_incluido = Math.round((pedido.total * 19) / 119);
    } else {
      const serv = db.servicios.find((s) => s.id_servicio === Number(id_servicio));
      const unitPrice = Number(precio_unitario || serv?.precio_venta || 0);
      const sub = cantNum * unitPrice;

      const existLine = pedido.detalles.servicios.find((l) => l.id_servicio === Number(id_servicio));
      if (existLine) {
        existLine.cantidad += cantNum;
        existLine.subtotal = existLine.cantidad * existLine.precio_unitario;
      } else {
        pedido.detalles.servicios.push({
          id_servicio: Number(id_servicio),
          nombre_servicio: serv?.nombre_servicio || 'Servicio Adicional',
          cantidad: cantNum,
          precio_unitario: unitPrice,
          subtotal: sub
        });
      }

      pedido.total += sub;
      pedido.saldo_pendiente += sub;
      pedido.iva_incluido = Math.round((pedido.total * 19) / 119);
    }

    saveDatabase(db);
    return ok({ ok: true, message: 'Producto agregado al pedido exitosamente', pedido });
  }

  const matchPedido = path.match(/^\/pedidos\/(\d+)$/);
  if (matchPedido && m === 'DELETE') {
    const id = Number(matchPedido[1]);
    db.pedidos = db.pedidos.filter((p) => p.id_pedido !== id);
    saveDatabase(db);
    return ok({ message: 'Pedido eliminado con éxito' });
  }

  // Checkout desde el POS (solo estados 'Completado' o 'Pendiente')
  if (path === '/pos/checkout' && m === 'POST') {
    const newId = (db.pedidos.reduce((max, p) => Math.max(max, p.id_pedido), 0) || 0) + 1;
    const {
      cliente,
      nombre_cliente,
      cedula_cliente,
      items = [],
      productos = [],
      servicios = [],
      metodo_pago,
      metodoPago = 'Efectivo',
      estado = 'Completado',
      total = 0,
      abono = 0,
      monto_abono
    } = body;

    const clienteFinal = (nombre_cliente || (typeof cliente === 'string' ? cliente : cliente?.nombre_cliente) || 'Consumidor Final').trim();
    const cedulaFinal = (cedula_cliente || (typeof cliente === 'object' ? cliente?.documento : '') || '').trim();

    // Normalizar lista unificada de items
    const rawItems = items.length > 0 ? items : [
      ...productos.map((p) => ({ ...p, tipo: 'Producto' })),
      ...servicios.map((s) => ({ ...s, tipo: 'Servicio' }))
    ];

    const prods = rawItems.filter((i) => i.tipo === 'Producto' || i.id_producto).map((i) => ({
      id_producto: i.id_producto,
      nombre_producto: i.nombre || i.nombre_producto || 'Producto',
      cantidad: Number(i.cantidad || i.qty || 1),
      precio_unitario: Number(i.precio || i.precio_unitario || 0),
      subtotal: Number(i.cantidad || i.qty || 1) * Number(i.precio || i.precio_unitario || 0)
    }));

    const servs = rawItems.filter((i) => i.tipo === 'Servicio' || i.id_servicio).map((i) => ({
      id_servicio: i.id_servicio,
      nombre_servicio: i.nombre || i.nombre_servicio || 'Servicio',
      cantidad: Number(i.cantidad || i.qty || 1),
      precio_unitario: Number(i.precio || i.precio_unitario || 0),
      subtotal: Number(i.cantidad || i.qty || 1) * Number(i.precio || i.precio_unitario || 0)
    }));

    // Descontar inventario de los productos comprados
    prods.forEach((item) => {
      const prod = db.productos.find((p) => p.id_producto === item.id_producto);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.cantidad);
      }
    });

    const isCompletado = String(estado).toLowerCase() === 'completado' || String(estado).toLowerCase() === 'completo';
    const isApartado = String(estado).toLowerCase() === 'apartado';
    const totalCalc = total ? Number(total) : [...prods, ...servs].reduce((acc, i) => acc + i.subtotal, 0);
    const abonoIn = isCompletado ? totalCalc : Number(abono || monto_abono || 0);
    const saldoCalc = Math.max(0, totalCalc - abonoIn);
    const pagoFinal = metodo_pago || metodoPago || 'Efectivo';

    // Estados conforme al script SQL: 1: Apartado, 2: Pendiente, 3: Cancelado, 4: Completado
    const estadoId = isCompletado ? 4 : isApartado ? 1 : 2;
    const estadoNombre = isCompletado ? 'Completado' : isApartado ? 'Apartado' : 'Pendiente';

    const nuevoPedido = {
      id_pedido: newId,
      id_cliente: cliente?.id_cliente || (cedulaFinal ? 2 : 1),
      nombre_cliente: clienteFinal,
      cedula_cliente: cedulaFinal,
      telefono_cliente: cliente?.telefono || '300-111-2233',
      fecha_pedido: new Date().toISOString(),
      total: totalCalc,
      iva_incluido: Math.round((totalCalc * 19) / 119),
      saldo_pendiente: saldoCalc,
      abono: abonoIn,
      metodo_pago: pagoFinal,
      id_estado: estadoId,
      nombre_estado: estadoNombre,
      detalles: {
        productos: prods,
        servicios: servs,
        pagos: [
          {
            fecha: new Date().toLocaleDateString('es-CO') + ' ' + new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
            monto: abonoIn,
            metodo: pagoFinal
          }
        ]
      }
    };

    db.pedidos.unshift(nuevoPedido);
    saveDatabase(db);
    return ok({ ok: true, message: 'Pedido registrado con éxito', id_pedido: newId, pedido: nuevoPedido });
  }

  // Fallback si la ruta no coincide
  console.warn(`[MockAPI] Ruta no mapeada explícitamente: ${m} ${path}`);
  return ok({ message: 'OK', fallback: true });
}

// Reset helper para restablecer los datos quemados a su estado original
export function resetMockDatabase() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ROLES_PERMS_KEY);
  db = loadDatabase();
  rolesPerms = loadRolesPerms();
}
