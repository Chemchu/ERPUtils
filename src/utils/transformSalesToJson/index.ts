import XLSX from "xlsx";
import fs from 'fs';
import { Producto, ProductoVendido, Venta } from "../../../types";

export enum TipoVenta {
    CobroRapido = "Cobro rápido",
    Tarjeta = "Tarjeta",
    Efectivo = "Efectivo"
}

/** Convierte strings del tipo 'dd/mm/aa hh:mm' a un Date */
const strToDate = (dtStr: string, hourStr: string): Date => {
    if (!dtStr) throw "El argumento dtStr no puede estar vacío";
    if (!hourStr) throw "El argumento hourStr no puede estar vacío";

    let dateParts = dtStr.split("/");
    let timeParts: string[] = [];

    if (hourStr.length > 3) {
        timeParts = [hourStr.substring(0, 2), hourStr.substring(2)]
    }
    else {
        timeParts = [`0${hourStr.substring(0, 1)}`, hourStr.substring(1)]
    }

    const anyo = Number(dateParts[2])
    const mes = Number(dateParts[1]) - 1
    const dia = Number(dateParts[0])
    const hora = Number(timeParts[0])
    const min = Number(timeParts[1])

    const fechaFinal = new Date(anyo, mes, dia, hora, min, 0, 0)
    return fechaFinal;
}

const VentaXLSXToMap = (fileName: string): Map<string, Venta> => {
    let workSheets: XLSX.WorkSheet = {}
    let sName = "";
    const workbook: XLSX.WorkBook = XLSX.readFile(`${fileName}`);

    for (const sheetName of workbook.SheetNames) {
        sName = sheetName;
        workSheets[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }
    const ventas = workSheets[sName] as any[];
    let ventasMap: Map<string, Venta> = new Map();

    for (let index = 0; index < ventas.length; index++) {
        const venta = ventas[index];
        const updatedVenta = CrearVenta(venta);
        if (updatedVenta) {
            ventasMap.set(updatedVenta.id, updatedVenta);
        }
    }

    return ventasMap;
}

const ProductosCSVToMap = (fileName: string): Map<string, Producto> => {
    let workSheets: XLSX.WorkSheet = {}
    let sName = "";
    const workbook: XLSX.WorkBook = XLSX.readFile(`${fileName}`);

    for (const sheetName of workbook.SheetNames) {
        sName = sheetName;
        workSheets[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }
    const productos = workSheets[sName] as any[];
    let prodMap: Map<string, Producto> = new Map();

    for (let index = 0; index < productos.length; index++) {
        const producto = productos[index];
        const updatedProd = CrearProducto(producto);
        if (updatedProd) {
            prodMap.set(updatedProd.ean, updatedProd);
        }
        else {
            console.log("Producto no creado correctamente");

        }
    }
    return prodMap;
}

const AddProductosToVentas = (ventas: Map<string, Venta>, productosVenta: string, productosDB: Map<string, Producto>): Map<string, Venta> => {
    let workSheets: XLSX.WorkSheet = {}
    let sName = "";
    const workbook: XLSX.WorkBook = XLSX.readFile(`${productosVenta}`);

    for (const sheetName of workbook.SheetNames) {
        sName = sheetName;
        workSheets[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    const prodPorVentas = workSheets[sName] as any[];

    for (let index = 0; index < prodPorVentas.length; index++) {
        const productoVendido = prodPorVentas[index];
        const prodEnDB = productosDB.get(String(productoVendido.ean));
        if (!prodEnDB) {
            // console.log(String(productoVendido.ean))
            continue;
        }
        const prod = CrearProductoVendido(productoVendido, prodEnDB);
        let venta = ventas.get(prod.idVenta);

        if (venta) {
            venta.productos.push(prod);
            ventas.set(venta.id, venta);
        }
    }
    return ventas;
}

const CrearVenta = (v: any): Venta | undefined => {
    if (v.total <= 0) { return undefined }

    let tipo: TipoVenta = v.isTarjeta == 1 ? TipoVenta.Tarjeta : TipoVenta.Efectivo;
    let cambio = v.cambio;

    if (v.cambio < 0) {
        cambio = 0;
        tipo = TipoVenta.CobroRapido
    }
    if (v.cambio > 0 && v.cambio < 0.01) {
        cambio = 0;
    }

    const fecha = strToDate(v.fecha, String(v.hora));
    const updatedVenta: Venta = {
        productos: [],
        id: v.id,
        cambio: cambio,
        cliente: {
            nombre: v.clienteNombre,
            calle: v.clienteNombre,
            cp: v.clienteNombre,
            nif: v.clienteNombre
        },
        descuentoEfectivo: v.dto || 0,
        descuentoPorcentaje: v.dto || 0,
        dineroEntregadoTarjeta: tipo === TipoVenta.Tarjeta ? v.entregado : 0,
        dineroEntregadoEfectivo: tipo === TipoVenta.Tarjeta ? 0 : (v.entregado || v.pagado),
        precioVentaTotalSinDto: v.total,
        modificadoPor: {
            apellidos: "",
            dni: "",
            email: "",
            nombre: "",
            rol: "",
        },
        vendidoPor: {
            apellidos: "",
            dni: "",
            email: "",
            nombre: "",
            rol: "",
        },
        createdAt: fecha,
        updatedAt: fecha,
        tipo: tipo,
        precioVentaTotal: v.total,
        tpv: v.tpvID,
    }

    return updatedVenta;
}

const CrearProducto = (p: any): Producto => {
    const prod: Producto = {
        _id: p._id,
        alta: p.alta,
        cantidad: p.cantidad,
        cantidadRestock: p.cantidadRestock,
        ean: p.ean,
        familia: p.familia,
        iva: p.iva,
        margen: p.margen,
        nombre: p.nombre,
        precioCompra: p.precioCompra,
        precioVenta: p.precioVenta,
        proveedor: p.proveedor || "",
    }

    return prod;
}

const CrearProductoVendido = (p: any, productoEnDb: Producto): ProductoVendido => {
    const prod: ProductoVendido = {
        idVenta: p.idVenta,
        idProducto: p.productoEnDb._id,
        nombre: p.nombre,
        cantidadVendida: p.cantidadVendida,
        familia: p.familia,
        dto: p.dto,
        ean: p.ean,
        iva: p.iva,
        precioCompra: productoEnDb.precioCompra || (p.precioConIva / (p.margen / 100) + 1) / ((p.iva / 100) + 1),
        precioVenta: p.precioConIva,
        precioFinal: p.precioConIva - (p.precioConIva * (p.dto / 100)),
        nombreProveedor: p.nombreProveedor || "",
        margen: p.margen
    }

    return prod
}

let productosMap = ProductosCSVToMap("productos.csv")

let ventasMap = VentaXLSXToMap("ventas.xlsx");
ventasMap = AddProductosToVentas(ventasMap, "productosPorVenta.xlsx", productosMap);
const ventas = Array.from(ventasMap.values());

fs.writeFile("ventasJsonTPV.json", JSON.stringify(ventas), function (err) {
    if (err) {
        console.log(err);
    }
});