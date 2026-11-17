// Base de datos quemada (Mock Data) para PRIGMA — Variedades Carito
// Contiene datos realistas y estructurados acordes al modelo del negocio.

// Helper para calcular fechas relativas a la semana actual
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Lunes de la semana actual
const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
const getDayIso = (offsetDays) => {
  const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + offsetDays);
  return toIso(d);
};

export const INITIAL_MOCK_DATA = {
  tiposDocumento: [
    { id_tipo_documento: 1, descripcion: 'Cédula de Ciudadanía', abreviatura: 'CC' },
    { id_tipo_documento: 2, descripcion: 'Tarjeta de Identidad', abreviatura: 'TI' },
    { id_tipo_documento: 3, descripcion: 'NIT', abreviatura: 'NIT' },
    { id_tipo_documento: 4, descripcion: 'Cédula de Extranjería', abreviatura: 'CE' },
    { id_tipo_documento: 5, descripcion: 'Pasaporte', abreviatura: 'PAS' }
  ],

  roles: [
    {
      id_rol: 1,
      nombre_rol: 'Administrador',
      descripcion: 'Acceso total y administración de todos los módulos del sistema',
      estado: 1
    },
    {
      id_rol: 2,
      nombre_rol: 'Vendedor',
      descripcion: 'Gestión de ventas, caja POS, clientes, pedidos y consulta de catálogo',
      estado: 1
    },
    {
      id_rol: 3,
      nombre_rol: 'Operador de Servicios',
      descripcion: 'Gestión y ejecución de servicios, agenda de citas y fotocopiado',
      estado: 1
    }
  ],

  permisos: [
    { id_permiso: 1, nombre_permiso: 'Dashboard' },
    { id_permiso: 2, nombre_permiso: 'Roles' },
    { id_permiso: 3, nombre_permiso: 'Gestión de Usuarios' },
    { id_permiso: 4, nombre_permiso: 'Categoría de Productos' },
    { id_permiso: 5, nombre_permiso: 'Gestión de Productos' },
    { id_permiso: 6, nombre_permiso: 'Proveedores' },
    { id_permiso: 7, nombre_permiso: 'Gestión de Compras' },
    { id_permiso: 8, nombre_permiso: 'Categoría de Servicios' },
    { id_permiso: 9, nombre_permiso: 'Gestión de Servicios' },
    { id_permiso: 10, nombre_permiso: 'Empleados' },
    { id_permiso: 11, nombre_permiso: 'Agenda' },
    { id_permiso: 12, nombre_permiso: 'Pedidos' },
    { id_permiso: 13, nombre_permiso: 'Clientes' },
    { id_permiso: 14, nombre_permiso: 'Ventas' }
  ],

  privilegios: [
    { id_privilegio: 1, nombre_privilegio: 'Ver' },
    { id_privilegio: 2, nombre_privilegio: 'Crear' },
    { id_privilegio: 3, nombre_privilegio: 'Editar' },
    { id_privilegio: 4, nombre_privilegio: 'Eliminar' },
    { id_privilegio: 5, nombre_privilegio: 'Cambiar Estado' }
  ],

  usuarios: [
    {
      id_usuario: 1,
      nombre_usuario: 'Carolina',
      apellido_usuario: 'González',
      id_tipo_documento: 1,
      tipo_documento: 'CC',
      documento: '1001000001',
      telefono: '310-234-5678',
      id_rol: 1,
      nombre_rol: 'Administrador',
      estado: 1,
      fecha_creacion: '2026-01-15T08:00:00.000Z'
    },
    {
      id_usuario: 2,
      nombre_usuario: 'Danilo',
      apellido_usuario: 'Velásquez',
      id_tipo_documento: 1,
      tipo_documento: 'CC',
      documento: '1001000002',
      telefono: '311-345-6789',
      id_rol: 2,
      nombre_rol: 'Vendedor',
      estado: 1,
      fecha_creacion: '2026-02-01T08:00:00.000Z'
    },
    {
      id_usuario: 3,
      nombre_usuario: 'Diego',
      apellido_usuario: 'Agudelo',
      id_tipo_documento: 1,
      tipo_documento: 'CC',
      documento: '1001000003',
      telefono: '312-456-7890',
      id_rol: 3,
      nombre_rol: 'Operador de Servicios',
      estado: 1,
      fecha_creacion: '2026-02-15T08:00:00.000Z'
    },
    {
      id_usuario: 4,
      nombre_usuario: 'Deiby',
      apellido_usuario: 'Rojas',
      id_tipo_documento: 1,
      tipo_documento: 'CC',
      documento: '1001000004',
      telefono: '313-567-8901',
      id_rol: 2,
      nombre_rol: 'Vendedor',
      estado: 1,
      fecha_creacion: '2026-03-01T08:00:00.000Z'
    },
    {
      id_usuario: 5,
      nombre_usuario: 'Arlex',
      apellido_usuario: 'Barrada',
      id_tipo_documento: 1,
      tipo_documento: 'CC',
      documento: '1001000005',
      telefono: '314-678-9012',
      id_rol: 3,
      nombre_rol: 'Operador de Servicios',
      estado: 1,
      fecha_creacion: '2026-03-15T08:00:00.000Z'
    }
  ],

  categoriasProducto: [
    {
      id_categoria_producto: 1,
      nombre_categoria: 'Cuadernos y Libretas',
      descripcion: 'Cuadernos argollados, cosidos, libretas de apuntes y agendas',
      estado: 1
    },
    {
      id_categoria_producto: 2,
      nombre_categoria: 'Escritura y Corrección',
      descripcion: 'Bolígrafos, lápices de grafito, marcadores, resaltadores y borradores',
      estado: 1
    },
    {
      id_categoria_producto: 3,
      nombre_categoria: 'Papelería y Resmas',
      descripcion: 'Resmas bond carta y oficio, cartulinas, papeles especiales y sobres',
      estado: 1
    },
    {
      id_categoria_producto: 4,
      nombre_categoria: 'Arte y Dibujo',
      descripcion: 'Cajas de colores, pinturas acrílicas, pinceles, lienzos y blocks',
      estado: 1
    },
    {
      id_categoria_producto: 5,
      nombre_categoria: 'Belleza y Cosméticos',
      descripcion: 'Labiales, bases, esmaltes de uñas, pestañinas y cuidado facial',
      estado: 1
    },
    {
      id_categoria_producto: 6,
      nombre_categoria: 'Regalos y Accesorios',
      descripcion: 'Mochilas, cartucheras, moños, bolsas de regalo y peluches',
      estado: 1
    }
  ],

  productos: [
    {
      id_producto: 1,
      nombre_producto: 'Cuaderno Argollado 100H Cuadriculado',
      id_categoria_producto: 1,
      nombre_categoria: 'Cuadernos y Libretas',
      precio_venta: 14500,
      costo: 9200,
      stock: 48,
      stock_minimo: 10,
      estado: 1,
      descripcion: 'Cuaderno pasta semidura 100 hojas de alta resistencia'
    },
    {
      id_producto: 2,
      nombre_producto: 'Cuaderno Cosido 100H Rayado Norma',
      id_categoria_producto: 1,
      nombre_categoria: 'Cuadernos y Libretas',
      precio_venta: 8500,
      costo: 5000,
      stock: 65,
      stock_minimo: 15,
      estado: 1,
      descripcion: 'Cuaderno escolar clásico resistente con stickers y horario'
    },
    {
      id_producto: 3,
      nombre_producto: 'Caja Bolígrafos Kilométrico x12 Negro',
      id_categoria_producto: 2,
      nombre_categoria: 'Escritura y Corrección',
      precio_venta: 18000,
      costo: 11500,
      stock: 24,
      stock_minimo: 5,
      estado: 1,
      descripcion: 'Bolígrafo tinta suave punta media 1.0mm Paper Mate'
    },
    {
      id_producto: 4,
      nombre_producto: 'Marcador Permanente Sharpie Punta Fina',
      id_categoria_producto: 2,
      nombre_categoria: 'Escritura y Corrección',
      precio_venta: 5500,
      costo: 3200,
      stock: 35,
      stock_minimo: 8,
      estado: 1,
      descripcion: 'Marcador indeleble secado rápido tinta resistente al agua'
    },
    {
      id_producto: 5,
      nombre_producto: 'Resma Papel Carta Reprograf 75g',
      id_categoria_producto: 3,
      nombre_categoria: 'Papelería y Resmas',
      precio_venta: 22000,
      costo: 16000,
      stock: 18,
      stock_minimo: 6,
      estado: 1,
      descripcion: '500 hojas papel bond ecológico blancura 95% para impresoras'
    },
    {
      id_producto: 6,
      nombre_producto: 'Resma Papel Oficio Reprograf 75g',
      id_categoria_producto: 3,
      nombre_categoria: 'Papelería y Resmas',
      precio_venta: 26500,
      costo: 19500,
      stock: 12,
      stock_minimo: 5,
      estado: 1,
      descripcion: '500 hojas papel bond ecológico tamaño oficio para documentos'
    },
    {
      id_producto: 7,
      nombre_producto: 'Caja Colores x24 Norma Doble Punta',
      id_categoria_producto: 4,
      nombre_categoria: 'Arte y Dibujo',
      precio_venta: 32000,
      costo: 21000,
      stock: 15,
      stock_minimo: 4,
      estado: 1,
      descripcion: '24 colores intensos 12 lápices doble mina con sacapuntas'
    },
    {
      id_producto: 8,
      nombre_producto: 'Cartuchera Doble Compartimiento Carito',
      id_categoria_producto: 6,
      nombre_categoria: 'Regalos y Accesorios',
      precio_venta: 25000,
      costo: 14000,
      stock: 8,
      stock_minimo: 3,
      estado: 1,
      descripcion: 'Estuche organizador con cremalleras reforzadas de tela lona'
    },
    {
      id_producto: 9,
      nombre_producto: 'Labial Mate Larga Duración Velvet',
      id_categoria_producto: 5,
      nombre_categoria: 'Belleza y Cosméticos',
      precio_venta: 19500,
      costo: 10000,
      stock: 20,
      stock_minimo: 5,
      estado: 1,
      descripcion: 'Acabado mate aterciopelado hidratante que no transfiere'
    },
    {
      id_producto: 10,
      nombre_producto: 'Calculadora Científica Casio fx-82MS',
      id_categoria_producto: 4,
      nombre_categoria: 'Arte y Dibujo',
      precio_venta: 65000,
      costo: 45000,
      stock: 6,
      stock_minimo: 2,
      estado: 1,
      descripcion: 'Calculadora 240 funciones con pantalla de 2 líneas a pilas'
    }
  ],

  proveedores: [
    {
      id_proveedor: 1,
      nombre_proveedor: 'Carvajal Educación S.A.S. (Norma)',
      persona_juridica: true,
      id_tipo_documento: 3,
      tipo_documento: 'NIT',
      documento: '890.123.456-1',
      nombre_contacto: 'Carlos Mendoza',
      contacto_persona: 'Carlos Mendoza',
      telefono_proveedor: '310-987-6543',
      correo_proveedor: 'ventas@carvajal.com',
      direccion_proveedor: 'Calle 10 #42-15 Medellín',
      estado: 1,
      categorias: [1, 2, 4]
    },
    {
      id_proveedor: 2,
      nombre_proveedor: 'Faber-Castell Colombia S.A.',
      persona_juridica: true,
      id_tipo_documento: 3,
      tipo_documento: 'NIT',
      documento: '860.234.567-2',
      nombre_contacto: 'Mariana Ochoa',
      contacto_persona: 'Mariana Ochoa',
      telefono_proveedor: '315-876-5432',
      correo_proveedor: 'pedidos@fabercastell.com.co',
      direccion_proveedor: 'Av. El Dorado #68-45 Bogotá',
      estado: 1,
      categorias: [2, 4]
    },
    {
      id_proveedor: 3,
      nombre_proveedor: 'Papeles del Cauca (Reprograf)',
      persona_juridica: true,
      id_tipo_documento: 3,
      tipo_documento: 'NIT',
      documento: '800.345.678-3',
      nombre_contacto: 'Jorge Restrepo',
      contacto_persona: 'Jorge Restrepo',
      telefono_proveedor: '318-765-4321',
      correo_proveedor: 'distribucion@reprograf.com',
      direccion_proveedor: 'Carrera 50 #30-20 Cali',
      estado: 1,
      categorias: [3]
    },
    {
      id_proveedor: 4,
      nombre_proveedor: 'Cosméticos Belleza Real S.A.S.',
      persona_juridica: true,
      id_tipo_documento: 3,
      tipo_documento: 'NIT',
      documento: '901.456.789-4',
      nombre_contacto: 'Viviana Gómez',
      contacto_persona: 'Viviana Gómez',
      telefono_proveedor: '300-654-3210',
      correo_proveedor: 'contacto@bellezareal.co',
      direccion_proveedor: 'Calle 33 #65-10 Medellín',
      estado: 1,
      categorias: [5, 6]
    }
  ],

  categoriasServicio: [
    {
      id_categoria_servicio: 1,
      nombre_categoria: 'Fotocopiado e Impresión',
      descripcion: 'Impresiones láser, fotocopias y copias de planos en distintos papeles',
      estado: 1
    },
    {
      id_categoria_servicio: 2,
      nombre_categoria: 'Acabados y Encuadernación',
      descripcion: 'Laminaciones, plastificados y anillados doble O',
      estado: 1
    },
    {
      id_categoria_servicio: 3,
      nombre_categoria: 'Trámites y Asesoría Digital',
      descripcion: 'Escaneo a USB/Email, trámites en línea, antecedentes y certificados',
      estado: 1
    },
    {
      id_categoria_servicio: 4,
      nombre_categoria: 'Belleza Express',
      descripcion: 'Maquillaje rápido, arreglo de cejas y manicure básico',
      estado: 1
    }
  ],

  servicios: [
    {
      id_servicio: 1,
      nombre_servicio: 'Fotocopia Blanco y Negro Carta/Oficio',
      id_categoria_servicio: 1,
      nombre_categoria: 'Fotocopiado e Impresión',
      precio_venta: 300,
      costo: 70,
      duracion_minutos: 2,
      estado: 1,
      descripcion: 'Copia en papel bond alta blancura'
    },
    {
      id_servicio: 2,
      nombre_servicio: 'Impresión Láser Color Carta',
      id_categoria_servicio: 1,
      nombre_categoria: 'Fotocopiado e Impresión',
      precio_venta: 1500,
      costo: 400,
      duracion_minutos: 3,
      estado: 1,
      descripcion: 'Impresión digital full color calidad fotográfica'
    },
    {
      id_servicio: 3,
      nombre_servicio: 'Laminado Térmico de Documento / Carnet',
      id_categoria_servicio: 2,
      nombre_categoria: 'Acabados y Encuadernación',
      precio_venta: 3500,
      costo: 900,
      duracion_minutos: 5,
      estado: 1,
      descripcion: 'Plastificado rígido brillante para documentos'
    },
    {
      id_servicio: 4,
      nombre_servicio: 'Anillado Doble O Metálico (hasta 100H)',
      id_categoria_servicio: 2,
      nombre_categoria: 'Acabados y Encuadernación',
      precio_venta: 6000,
      costo: 1800,
      duracion_minutos: 10,
      estado: 1,
      descripcion: 'Encuadernación con tapas plásticas y espiral'
    },
    {
      id_servicio: 5,
      nombre_servicio: 'Escaneo de Documentos a PDF / Email',
      id_categoria_servicio: 3,
      nombre_categoria: 'Trámites y Asesoría Digital',
      precio_venta: 1000,
      costo: 100,
      duracion_minutos: 3,
      estado: 1,
      descripcion: 'Digitalización óptica en alta resolución'
    },
    {
      id_servicio: 6,
      nombre_servicio: 'Maquillaje Express de Ojos y Labios',
      id_categoria_servicio: 4,
      nombre_categoria: 'Belleza Express',
      precio_venta: 25000,
      costo: 8000,
      duracion_minutos: 25,
      estado: 1,
      descripcion: 'Sesión rápida para eventos de día o noche'
    }
  ],

  clientes: [
    {
      id_cliente: 1,
      nombre_cliente: 'María Camila García',
      id_tipo_documento: 1,
      nombre_tipo_documento: 'CC',
      documento: '1020304050',
      telefono: '300-111-2233',
      correo: 'camila.garcia@gmail.com',
      direccion: 'Cra 24 #70-12',
      estado: 1
    },
    {
      id_cliente: 2,
      nombre_cliente: 'Carlos Alberto Valencia',
      id_tipo_documento: 1,
      nombre_tipo_documento: 'CC',
      documento: '1098234567',
      telefono: '312-456-7890',
      correo: 'carlos.valencia@hotmail.com',
      direccion: 'Calle 65 #32-18',
      estado: 1
    },
    {
      id_cliente: 3,
      nombre_cliente: 'Ana Lucía Rodríguez',
      id_tipo_documento: 1,
      nombre_tipo_documento: 'CC',
      documento: '1030405060',
      telefono: '315-998-1122',
      correo: 'ana.rodriguez@outlook.com',
      direccion: 'Cra 30 #80-45',
      estado: 1
    },
    {
      id_cliente: 4,
      nombre_cliente: 'Laura Sofía Martínez',
      id_tipo_documento: 1,
      nombre_tipo_documento: 'CC',
      documento: '1040506070',
      telefono: '320-776-5544',
      correo: 'laura.martinez@gmail.com',
      direccion: 'Av 80 #45-30',
      estado: 1
    },
    {
      id_cliente: 5,
      nombre_cliente: 'Valentina Cruz Morales',
      id_tipo_documento: 1,
      nombre_tipo_documento: 'CC',
      documento: '1050607080',
      telefono: '311-889-9001',
      correo: 'valen.cruz@yahoo.com',
      direccion: 'Calle 72 #28-14',
      estado: 1
    }
  ],

  estados: [
    { id_estado: 1, nombre_estado: 'Apartado' },
    { id_estado: 2, nombre_estado: 'Pendiente' },
    { id_estado: 3, nombre_estado: 'Cancelado' },
    { id_estado: 4, nombre_estado: 'Completado' }
  ],

  pedidos: [
    {
      id_pedido: 1,
      id_cliente: 1,
      nombre_cliente: 'María Camila García',
      cedula_cliente: '1020304050',
      telefono_cliente: '300-111-2233',
      fecha_pedido: '2026-11-15T14:32:00.000Z',
      total: 52360,
      iva_incluido: 8360,
      saldo_pendiente: 0,
      abono: 52360,
      metodo_pago: 'Efectivo',
      id_estado: 4,
      nombre_estado: 'Completado',
      detalles: {
        productos: [
          { id_producto: 1, nombre_producto: 'Cuaderno Argollado 100H Cuadriculado', cantidad: 2, precio_unitario: 14500, subtotal: 29000 },
          { id_producto: 4, nombre_producto: 'Marcador Permanente Sharpie', cantidad: 1, precio_unitario: 5500, subtotal: 5500 }
        ],
        servicios: [
          { id_servicio: 2, nombre_servicio: 'Impresión Láser Color Carta', cantidad: 11, precio_unitario: 1500, subtotal: 16500 }
        ],
        pagos: [
          { fecha: '2026-11-15 14:32', monto: 52360, metodo: 'Efectivo' }
        ]
      }
    },
    {
      id_pedido: 2,
      id_cliente: 2,
      nombre_cliente: 'Carlos Alberto Valencia',
      cedula_cliente: '1098234567',
      telefono_cliente: '312-456-7890',
      fecha_pedido: '2026-11-16T11:15:00.000Z',
      total: 114000,
      iva_incluido: 18201,
      saldo_pendiente: 64000,
      abono: 50000,
      metodo_pago: 'Transferencia',
      id_estado: 2,
      nombre_estado: 'Pendiente',
      detalles: {
        productos: [
          { id_producto: 8, nombre_producto: 'Cartuchera Doble Compartimiento Carito', cantidad: 2, precio_unitario: 25000, subtotal: 50000 },
          { id_producto: 7, nombre_producto: 'Caja Colores x24 Norma Doble Punta', cantidad: 2, precio_unitario: 32000, subtotal: 64000 }
        ],
        servicios: [],
        pagos: [
          { fecha: '2026-11-16 11:15', monto: 50000, metodo: 'Transferencia' }
        ]
      }
    },
    {
      id_pedido: 3,
      id_cliente: 3,
      nombre_cliente: 'Ana Lucía Rodríguez',
      cedula_cliente: '1030405060',
      telefono_cliente: '315-998-1122',
      fecha_pedido: '2026-11-16T15:45:00.000Z',
      total: 41650,
      iva_incluido: 6650,
      saldo_pendiente: 0,
      abono: 41650,
      metodo_pago: 'Transferencia',
      id_estado: 4,
      nombre_estado: 'Completado',
      detalles: {
        productos: [
          { id_producto: 3, nombre_producto: 'Caja Bolígrafos Kilométrico x12 Negro', cantidad: 1, precio_unitario: 18000, subtotal: 18000 },
          { id_producto: 9, nombre_producto: 'Labial Mate Larga Duración Velvet', cantidad: 1, precio_unitario: 19500, subtotal: 19500 }
        ],
        servicios: [
          { id_servicio: 1, nombre_servicio: 'Fotocopia Blanco y Negro Carta/Oficio', cantidad: 14, precio_unitario: 300, subtotal: 4200 }
        ],
        pagos: [
          { fecha: '2026-11-16 15:45', monto: 41650, metodo: 'Transferencia' }
        ]
      }
    },
    {
      id_pedido: 4,
      id_cliente: 4,
      nombre_cliente: 'Laura Sofía Martínez',
      cedula_cliente: '1040506070',
      telefono_cliente: '320-776-5544',
      fecha_pedido: '2026-11-17T09:20:00.000Z',
      total: 105910,
      iva_incluido: 16910,
      saldo_pendiente: 0,
      abono: 105910,
      metodo_pago: 'Efectivo',
      id_estado: 4,
      nombre_estado: 'Completado',
      detalles: {
        productos: [
          { id_producto: 5, nombre_producto: 'Resma Papel Carta Reprograf 75g', cantidad: 2, precio_unitario: 22000, subtotal: 44000 },
          { id_producto: 1, nombre_producto: 'Cuaderno Argollado 100H Cuadriculado', cantidad: 2, precio_unitario: 14500, subtotal: 29000 }
        ],
        servicios: [
          { id_servicio: 6, nombre_servicio: 'Maquillaje Express de Ojos y Labios', cantidad: 1, precio_unitario: 25000, subtotal: 25000 },
          { id_servicio: 4, nombre_servicio: 'Anillado Doble O Metálico (hasta 100H)', cantidad: 1, precio_unitario: 6000, subtotal: 6000 }
        ],
        pagos: [
          { fecha: '2026-11-17 09:20', monto: 105910, metodo: 'Efectivo' }
        ]
      }
    },
    {
      id_pedido: 5,
      id_cliente: 5,
      nombre_cliente: 'Valentina Cruz Morales',
      cedula_cliente: '1050607080',
      telefono_cliente: '311-889-9001',
      fecha_pedido: '2026-11-17T10:05:00.000Z',
      total: 78500,
      iva_incluido: 12534,
      saldo_pendiente: 78500,
      abono: 0,
      metodo_pago: 'Efectivo',
      id_estado: 2,
      nombre_estado: 'Pendiente',
      detalles: {
        productos: [
          { id_producto: 6, nombre_producto: 'Resma Papel Oficio Reprograf 75g', cantidad: 2, precio_unitario: 26500, subtotal: 53000 },
          { id_producto: 2, nombre_producto: 'Cuaderno Cosido 100H Rayado Norma', cantidad: 3, precio_unitario: 8500, subtotal: 25500 }
        ],
        servicios: [],
        pagos: []
      }
    }
  ],

  separados: [
    {
      id: 'SEP001',
      id_separado: 1,
      cliente: 'Carlos Valencia',
      avatar: 'CV',
      telefono: '312-456-7890',
      documento: '1098234567',
      id_producto: 8,
      producto: 'Cartuchera Doble Compartimiento Carito',
      cantidad: 2,
      total: 50000,
      abonado: 30000,
      fechaCreacion: '05/11/2026',
      fechaLimite: '20/11/2026',
      estado: 'En Curso',
      historialAbonos: [
        { fecha: '05/11/2026 10:15', monto: 20000, metodo: 'Efectivo' },
        { fecha: '12/11/2026 16:30', monto: 10000, metodo: 'Transferencia' }
      ]
    },
    {
      id: 'SEP002',
      id_separado: 2,
      cliente: 'Lucía Fernández',
      avatar: 'LF',
      telefono: '315-998-1122',
      documento: '1023456789',
      id_producto: 10,
      producto: 'Calculadora Científica Casio fx-82MS',
      cantidad: 1,
      total: 65000,
      abonado: 35000,
      fechaCreacion: '01/11/2026',
      fechaLimite: '18/11/2026',
      estado: 'En Curso',
      historialAbonos: [
        { fecha: '01/11/2026 11:00', monto: 35000, metodo: 'Efectivo' }
      ]
    },
    {
      id: 'SEP003',
      id_separado: 3,
      cliente: 'Andrés Gómez',
      avatar: 'AG',
      telefono: '300-112-3344',
      documento: '1034567890',
      id_producto: 7,
      producto: 'Caja Colores x24 Norma Doble Punta',
      cantidad: 2,
      total: 64000,
      abonado: 64000,
      fechaCreacion: '28/10/2026',
      fechaLimite: '10/11/2026',
      estado: 'Liquidado',
      historialAbonos: [
        { fecha: '28/10/2026 15:00', monto: 32000, metodo: 'Efectivo' },
        { fecha: '08/11/2026 09:40', monto: 32000, metodo: 'Transferencia' }
      ]
    }
  ],

  compras: [
    {
      id_compra: 1,
      num_factura_proveedor: 'FAC-8891',
      id_proveedor: 1,
      nombre_proveedor: 'Carvajal Educación S.A.S. (Norma)',
      id_categoria_producto: 1,
      nombre_categoria: 'Cuadernos y Libretas',
      id_usuario: 1,
      nombre_usuario: 'Carolina González',
      fecha_compra: '2026-11-05',
      id_estado: 4,
      nombre_estado: 'Completado',
      total_compra: 450000,
      total_items: 2,
      detalle: [
        {
          id_detalle_compra: 1,
          id_compra: 1,
          id_producto: 1,
          nombre_producto: 'Cuaderno Argollado 100H Cuadriculado',
          cantidad: 30,
          precio_unitario: 9200,
          porcentaje_descuento: 0,
          porcentaje_iva: 19
        },
        {
          id_detalle_compra: 2,
          id_compra: 1,
          id_producto: 2,
          nombre_producto: 'Cuaderno Cosido 100H Rayado Norma',
          cantidad: 30,
          precio_unitario: 5000,
          porcentaje_descuento: 0,
          porcentaje_iva: 19
        }
      ]
    },
    {
      id_compra: 2,
      num_factura_proveedor: 'FAC-9042',
      id_proveedor: 2,
      nombre_proveedor: 'Faber-Castell Colombia S.A.',
      id_categoria_producto: 2,
      nombre_categoria: 'Escritura y Corrección',
      id_usuario: 2,
      nombre_usuario: 'Danilo Velásquez',
      fecha_compra: '2026-11-10',
      id_estado: 4,
      nombre_estado: 'Completado',
      total_compra: 280000,
      total_items: 2,
      detalle: [
        {
          id_detalle_compra: 3,
          id_compra: 2,
          id_producto: 3,
          nombre_producto: 'Caja Bolígrafos Kilométrico x12 Negro',
          cantidad: 15,
          precio_unitario: 11500,
          porcentaje_descuento: 0,
          porcentaje_iva: 19
        },
        {
          id_detalle_compra: 4,
          id_compra: 2,
          id_producto: 4,
          nombre_producto: 'Marcador Permanente Sharpie Punta Fina',
          cantidad: 25,
          precio_unitario: 3200,
          porcentaje_descuento: 0,
          porcentaje_iva: 19
        }
      ]
    },
    {
      id_compra: 3,
      num_factura_proveedor: 'FAC-9210',
      id_proveedor: 3,
      nombre_proveedor: 'Papeles del Cauca (Reprograf)',
      id_categoria_producto: 3,
      nombre_categoria: 'Papelería y Resmas',
      id_usuario: 1,
      nombre_usuario: 'Carolina González',
      fecha_compra: '2026-11-14',
      id_estado: 2,
      nombre_estado: 'Pendiente',
      total_compra: 640000,
      total_items: 2,
      detalle: [
        {
          id_detalle_compra: 5,
          id_compra: 3,
          id_producto: 5,
          nombre_producto: 'Resma Papel Carta Reprograf 75g',
          cantidad: 25,
          precio_unitario: 16000,
          porcentaje_descuento: 0,
          porcentaje_iva: 19
        },
        {
          id_detalle_compra: 6,
          id_compra: 3,
          id_producto: 6,
          nombre_producto: 'Resma Papel Oficio Reprograf 75g',
          cantidad: 12,
          precio_unitario: 19500,
          porcentaje_descuento: 0,
          porcentaje_iva: 19
        }
      ]
    }
  ],

  // Horarios de turnos para empleados de la semana actual
  horarios: [
    // Lunes
    { id_horario: 1, id_usuario: 1, nombre_usuario: 'Carolina', apellido_usuario: 'González', nombre_rol: 'Administrador', fecha_trabajo: getDayIso(0) },
    { id_horario: 2, id_usuario: 2, nombre_usuario: 'Danilo', apellido_usuario: 'Velásquez', nombre_rol: 'Vendedor', fecha_trabajo: getDayIso(0) },
    { id_horario: 3, id_usuario: 4, nombre_usuario: 'Deiby', apellido_usuario: 'Rojas', nombre_rol: 'Vendedor', fecha_trabajo: getDayIso(0) },
    // Martes
    { id_horario: 4, id_usuario: 2, nombre_usuario: 'Danilo', apellido_usuario: 'Velásquez', nombre_rol: 'Vendedor', fecha_trabajo: getDayIso(1) },
    { id_horario: 5, id_usuario: 3, nombre_usuario: 'Diego', apellido_usuario: 'Agudelo', nombre_rol: 'Operador de Servicios', fecha_trabajo: getDayIso(1) },
    { id_horario: 6, id_usuario: 4, nombre_usuario: 'Deiby', apellido_usuario: 'Rojas', nombre_rol: 'Vendedor', fecha_trabajo: getDayIso(1) },
    // Miércoles
    { id_horario: 7, id_usuario: 1, nombre_usuario: 'Carolina', apellido_usuario: 'González', nombre_rol: 'Administrador', fecha_trabajo: getDayIso(2) },
    { id_horario: 8, id_usuario: 2, nombre_usuario: 'Danilo', apellido_usuario: 'Velásquez', nombre_rol: 'Vendedor', fecha_trabajo: getDayIso(2) },
    { id_horario: 9, id_usuario: 5, nombre_usuario: 'Arlex', apellido_usuario: 'Barrada', nombre_rol: 'Operador de Servicios', fecha_trabajo: getDayIso(2) },
    // Jueves
    { id_horario: 10, id_usuario: 2, nombre_usuario: 'Danilo', apellido_usuario: 'Velásquez', nombre_rol: 'Vendedor', fecha_trabajo: getDayIso(3) },
    { id_horario: 11, id_usuario: 3, nombre_usuario: 'Diego', apellido_usuario: 'Agudelo', nombre_rol: 'Operador de Servicios', fecha_trabajo: getDayIso(3) },
    { id_horario: 12, id_usuario: 4, nombre_usuario: 'Deiby', apellido_usuario: 'Rojas', nombre_rol: 'Vendedor', fecha_trabajo: getDayIso(3) },
    // Viernes
    { id_horario: 13, id_usuario: 1, nombre_usuario: 'Carolina', apellido_usuario: 'González', nombre_rol: 'Administrador', fecha_trabajo: getDayIso(4) },
    { id_horario: 14, id_usuario: 3, nombre_usuario: 'Diego', apellido_usuario: 'Agudelo', nombre_rol: 'Operador de Servicios', fecha_trabajo: getDayIso(4) },
    { id_horario: 15, id_usuario: 4, nombre_usuario: 'Deiby', apellido_usuario: 'Rojas', nombre_rol: 'Vendedor', fecha_trabajo: getDayIso(4) },
    { id_horario: 16, id_usuario: 5, nombre_usuario: 'Arlex', apellido_usuario: 'Barrada', nombre_rol: 'Operador de Servicios', fecha_trabajo: getDayIso(4) },
    // Sábado
    { id_horario: 17, id_usuario: 2, nombre_usuario: 'Danilo', apellido_usuario: 'Velásquez', nombre_rol: 'Vendedor', fecha_trabajo: getDayIso(5) },
    { id_horario: 18, id_usuario: 3, nombre_usuario: 'Diego', apellido_usuario: 'Agudelo', nombre_rol: 'Operador de Servicios', fecha_trabajo: getDayIso(5) },
    { id_horario: 19, id_usuario: 5, nombre_usuario: 'Arlex', apellido_usuario: 'Barrada', nombre_rol: 'Operador de Servicios', fecha_trabajo: getDayIso(5) },
    // Domingo
    { id_horario: 20, id_usuario: 5, nombre_usuario: 'Arlex', apellido_usuario: 'Barrada', nombre_rol: 'Operador de Servicios', fecha_trabajo: getDayIso(6) }
  ]
};

// Generar matriz canónica de 70 permisos x privilegios
export const ALL_PERMISOS_PRIVILEGIOS = [];
let ppIdCounter = 1;
INITIAL_MOCK_DATA.permisos.forEach((perm) => {
  INITIAL_MOCK_DATA.privilegios.forEach((priv) => {
    ALL_PERMISOS_PRIVILEGIOS.push({
      id_permiso_privilegio: ppIdCounter++,
      id_permiso: perm.id_permiso,
      nombre_permiso: perm.nombre_permiso,
      id_privilegio: priv.id_privilegio,
      nombre_privilegio: priv.nombre_privilegio
    });
  });
});
