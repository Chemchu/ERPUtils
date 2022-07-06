import XLSX from "xlsx";
import fs from 'fs';
import { ProductoVendido, Venta } from "../../../types";

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

    const fechaFinal = new Date(Number(dateParts[2]), Number(dateParts[1]) - 1, Number(dateParts[0]), Number(timeParts[0]), Number(timeParts[1]))
    return fechaFinal;
}

const VentaXLSXToJson = (fileName: string): Map<string, Venta> => {
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

const AddProductosToVentas = (ventas: Map<string, Venta>, fileName: string): Map<string, Venta> => {
    let workSheets: XLSX.WorkSheet = {}
    let sName = "";
    const workbook: XLSX.WorkBook = XLSX.readFile(`${fileName}`);

    for (const sheetName of workbook.SheetNames) {
        sName = sheetName;
        workSheets[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    const prodPorVentas = workSheets[sName] as any[];

    for (let index = 0; index < prodPorVentas.length; index++) {
        const productoVendido = prodPorVentas[index];
        const prod = CrearProductoVendido(productoVendido);
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
    let entregado = v.entregado;

    if (v.cambio < 0) {
        cambio = 0;
        entregado = v.pagado;
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
        dineroEntregadoEfectivo: tipo === TipoVenta.Tarjeta ? 0 : v.entregado,
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

const CrearProductoVendido = (p: any): ProductoVendido => {
    const prod: ProductoVendido = {
        idVenta: p.idVenta,
        idProducto: p.idProducto,
        nombre: p.nombre,
        cantidadVendida: p.cantidadVendida,
        dto: p.dto,
        ean: p.ean,
        iva: p.iva,
        precioCompra: p.precioSinIva,
        precioVenta: p.precioConIva,
        precioFinal: p.precioConIva,
        nombreProveedor: p.nombreProveedor || "",
        margen: p.margen
    }

    return prod
}

let ventasMap = VentaXLSXToJson("ventas2.xlsx");
ventasMap = AddProductosToVentas(ventasMap, "productosPorVenta2.xlsx");
const ventas = Array.from(ventasMap.values());

fs.writeFile("ventasJsonTPV2.json", JSON.stringify(ventas), function (err) {
    if (err) {
        console.log(err);
    }
});