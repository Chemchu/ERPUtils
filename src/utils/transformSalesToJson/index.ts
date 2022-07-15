import XLSX from "xlsx";
import fs from 'fs';
import { Producto, ProductoVendido, Venta } from "../../../types";

export enum TipoVenta {
    CobroRapido = "Cobro rápido",
    Tarjeta = "Tarjeta",
    Efectivo = "Efectivo"
}

export const strToDate = (dtStr: string, hourStr: string): Date => {
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

    const anyo = dateParts[2].length < 3 ? Number("20" + dateParts[2]) : Number(dateParts[2])
    const mes = Number(dateParts[1]) - 1
    const dia = Number(dateParts[0])
    const hora = Number(timeParts[0])
    const min = Number(timeParts[1])

    const fechaFinal = new Date(anyo, mes, dia, hora, min, 0, 0)
    return fechaFinal;
}

export const VentaXLSXToMap = (fileName: string): Map<string, Venta> => {
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

export const ProductosCSVToMap = (fileName: string): Map<string, Producto> => {
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
        let updatedProd = CrearProducto(producto);
        if (updatedProd) {
            // if (prodMap.has(updatedProd.ean)) {
            //     updatedProd.ean = updatedProd.nombre + "_"; // Asignar "EAN" único
            // }
            prodMap.set(updatedProd.ean, updatedProd)
        }
    }
    return prodMap;
}

export const AddProductosToVentas = (ventas: Map<string, Venta>, productosVenta: string, productosDB: Map<string, Producto>): Map<string, Venta> => {
    let workSheets: XLSX.WorkSheet = {}
    let sName = "";
    const workbook: XLSX.WorkBook = XLSX.readFile(`${productosVenta}`);
    const ventasUpdated: Map<string, Venta> = new Map()

    for (const sheetName of workbook.SheetNames) {
        sName = sheetName;
        workSheets[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    const prodPorVentas = workSheets[sName] as any[];
    for (let index = 0; index < prodPorVentas.length; index++) {
        const productoVendido = prodPorVentas[index];
        if (!productoVendido.nombre) {
            continue;
        }
        if (!productoVendido.ean) {
            continue;
        }

        const prodEnDBEAN = productosDB.get(productoVendido.ean);
        const prodEnDBNombre = productosDB.get(productoVendido.nombre + "_");
        let producto = prodEnDBEAN ? prodEnDBEAN : prodEnDBNombre

        if (!producto) {
            producto = productoVendido
        }

        if (!producto) {
            continue
        }

        const prod = CrearProductoVendido(productoVendido, producto); // Cambiar la _id por la interna de mongo
        const venta = ventas.get(prod.idVenta);

        if (venta) {
            venta.productos.push(prod);
            ventasUpdated.set(venta.id, venta);
        }
    }
    return ventasUpdated;
}

export const CrearVenta = (v: any): Venta | undefined => {
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
        dineroEntregadoTarjeta: tipo === TipoVenta.Tarjeta ? v.pagado : 0,
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

export const CrearProducto = (p: any): Producto => {
    const ean = p.EAN || p.ean
    const prod: Producto = {
        _id: p._id,
        nombre: p.nombre || p.NOMBRE,
        familia: p.familia || p.FAMILIA,
        precioCompra: p.precioCompra || p.PRECIO_COMPRA,
        precioVenta: p.precioVenta || p.PRECIO_VENTA,
        iva: p.iva || p.IVA,
        margen: p.margen || p.MARGEN,
        ean: String(ean),
        cantidad: p.cantidad || p.CANTIDAD,
        cantidadRestock: p.cantidadRestock || p.CANTIDAD_RESTOCK,
        proveedor: p.proveedor || p.PROVEEDOR || p.NOMBRE_PROV || "",
        alta: p.alta || p.ALTA || true,
    }

    return prod;
}

export const CrearProductoVendido = (productoEnVenta: any, productoEnDb: Producto): ProductoVendido => {
    const precioConIva = (productoEnDb.precioCompra * (productoEnVenta.iva / 100))
    const margen = (productoEnVenta.precioConIva - precioConIva) / precioConIva

    const prod: ProductoVendido = {
        idVenta: productoEnVenta.idVenta,
        _id: productoEnDb._id,
        nombre: productoEnVenta.nombre,
        cantidadVendida: productoEnVenta.cantidadVendida,
        familia: productoEnDb.familia,
        dto: productoEnVenta.dto,
        ean: productoEnVenta.ean,
        iva: productoEnVenta.iva,
        precioCompra: productoEnDb.precioCompra,
        precioVenta: productoEnVenta.precioConIva,
        precioFinal: productoEnVenta.precioConIva - (productoEnVenta.precioConIva * (productoEnVenta.dto / 100)),
        proveedor: productoEnDb.proveedor || productoEnVenta.proveedor || productoEnVenta.PROVEEDOR || productoEnVenta.NOMBRE_PROV || "",
        margen: margen
    }

    return prod
}

let productosMap = ProductosCSVToMap("productos.csv")
let ventasMap = VentaXLSXToMap("ventas.xlsx");
ventasMap = AddProductosToVentas(ventasMap, "productosPorVenta.xlsx", productosMap);
const ventas = Array.from(ventasMap.values());
const particiones = 30;
const longArray = Math.ceil(ventas.length / particiones);

// const productosWorksheet = XLSX.utils.json_to_sheet(prodEanFixed);
// const csv = XLSX.utils.sheet_to_csv(productosWorksheet);

// fs.writeFile("productos2.csv", csv, function (err) {
//     if (err) {
//         console.log(err);
//     }
// });

// fs.writeFile("productosEanFixed.csv", JSON.stringify(prodEanFixed), function (err) {
//     if (err) {
//         console.log(err);
//     }
// });

fs.writeFile("ventasJsonTPV.json", JSON.stringify(ventas), function (err) {
    if (err) {
        console.log(err);
    }
});

// for (let i = 0; i < particiones; i++) {
//     let arraySlice = ventas.slice(i * longArray, (i + 1) * longArray)
//     if (i + 1 === particiones) {
//         arraySlice = ventas.slice(-longArray)
//     }

//     fs.writeFile(`ventasJsonTPV${i}.json`, JSON.stringify(arraySlice), function (err) {
//         if (err) {
//             console.log(err);
//         }
//     });
// }