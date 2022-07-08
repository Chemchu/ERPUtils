export interface ProductoXLSX {
    Nombre: string,
    EAN: string,
    Precio: number,
    NombreProveedor?: string
    Diferencia?: number | string
}

export interface Producto {
    _id: string
    nombre: string
    proveedor: string
    familia: string
    precioVenta: number
    precioCompra: number
    iva: number
    ean: string
    margen: number
    alta: boolean
    cantidad: number
    cantidadRestock: number
}

export interface ProductoVendido {
    idVenta: string,
    _id: string,
    nombre: string,
    familia: string,
    ean: string,
    precioCompra: number,
    precioVenta: number,
    precioFinal: number,
    nombreProveedor?: string
    cantidadVendida: number
    dto: number
    iva: number,
    margen: number
}

export interface Empleado {
    nombre: string,
    apellidos: string,
    dni: string,
    rol: string,
    email: string
}

export interface Cliente {
    nombre: string,
    nif: string,
    calle: string,
    cp: string
}

export interface Venta {
    id: string,
    productos: ProductoVendido[]
    dineroEntregadoEfectivo: number,
    dineroEntregadoTarjeta: number,
    precioVentaTotalSinDto: number,
    precioVentaTotal: number,
    cambio: number,
    cliente: Cliente
    vendidoPor: Empleado,
    modificadoPor: Empleado,
    tipo: string,
    descuentoEfectivo: number,
    descuentoPorcentaje: number,
    tpv: string,
    createdAt: Date,
    updatedAt: Date,
}

