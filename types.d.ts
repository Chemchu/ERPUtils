export interface ProductoXLSX {
    Nombre: string,
    EAN: string,
    Precio: number,
    NombreProveedor?: string
    Diferencia?: number | string
}

export interface ProductoVendido {
    idVenta: string,
    idProducto: string,
    nombre: string,
    ean: string,
    precioCompra: number,
    precioVenta: number,
    nombreProveedor?: string
    cantidadVendida: number
    dto: number
    iva: number,
    margen: number
}

export interface Venta {
    id: string,
    productos: ProductoVendido[]
    dineroEntregadoEfectivo: number,
    dineroEntregadoTarjeta: number,
    precioVentaTotalSinDto: number,
    precioVentaTotal: number,
    cambio: number,
    cliente: {
        nombre: string,
        nif: string,
        calle: string,
        cp: string
    }
    vendidoPor: {
        nombre: string,
        apellidos: string,
        dni: string,
        rol: string,
        email: string
    },
    modificadoPor: {
        nombre: string,
        apellidos: string,
        dni: string,
        rol: string,
        email: string,
    },
    tipo: string,
    descuentoEfectivo: number,
    descuentoPorcentaje: number,
    tpv: string,
    createdAt: Date,
    updatedAt: Date,
}

