"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrearProductoVendido = exports.CrearProducto = exports.CrearVenta = exports.AddProductosToVentas = exports.ProductosCSVToMap = exports.VentaXLSXToMap = exports.strToDate = exports.TipoVenta = void 0;
const xlsx_1 = __importDefault(require("xlsx"));
const fs_1 = __importDefault(require("fs"));
var TipoVenta;
(function (TipoVenta) {
    TipoVenta["CobroRapido"] = "Cobro r\u00E1pido";
    TipoVenta["Tarjeta"] = "Tarjeta";
    TipoVenta["Efectivo"] = "Efectivo";
})(TipoVenta = exports.TipoVenta || (exports.TipoVenta = {}));
const strToDate = (dtStr, hourStr) => {
    if (!dtStr)
        throw "El argumento dtStr no puede estar vacío";
    if (!hourStr)
        throw "El argumento hourStr no puede estar vacío";
    let dateParts = dtStr.split("/");
    let timeParts = [];
    if (hourStr.length > 3) {
        timeParts = [hourStr.substring(0, 2), hourStr.substring(2)];
    }
    else {
        timeParts = [`0${hourStr.substring(0, 1)}`, hourStr.substring(1)];
    }
    const anyo = dateParts[2].length < 3 ? Number("20" + dateParts[2]) : Number(dateParts[2]);
    const mes = Number(dateParts[1]) - 1;
    const dia = Number(dateParts[0]);
    const hora = Number(timeParts[0]);
    const min = Number(timeParts[1]);
    const fechaFinal = new Date(anyo, mes, dia, hora, min, 0, 0);
    return fechaFinal;
};
exports.strToDate = strToDate;
const VentaXLSXToMap = (fileName) => {
    let workSheets = {};
    let sName = "";
    const workbook = xlsx_1.default.readFile(`${fileName}`);
    for (const sheetName of workbook.SheetNames) {
        sName = sheetName;
        workSheets[sheetName] = xlsx_1.default.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }
    const ventas = workSheets[sName];
    let ventasMap = new Map();
    for (let index = 0; index < ventas.length; index++) {
        const venta = ventas[index];
        const updatedVenta = (0, exports.CrearVenta)(venta);
        if (updatedVenta) {
            ventasMap.set(updatedVenta.id, updatedVenta);
        }
    }
    return ventasMap;
};
exports.VentaXLSXToMap = VentaXLSXToMap;
const ProductosCSVToMap = (fileName) => {
    let workSheets = {};
    let sName = "";
    const workbook = xlsx_1.default.readFile(`${fileName}`);
    for (const sheetName of workbook.SheetNames) {
        sName = sheetName;
        workSheets[sheetName] = xlsx_1.default.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }
    const productos = workSheets[sName];
    let prodMap = new Map();
    for (let index = 0; index < productos.length; index++) {
        const producto = productos[index];
        let updatedProd = (0, exports.CrearProducto)(producto);
        if (updatedProd) {
            // if (prodMap.has(updatedProd.ean)) {
            //     updatedProd.ean = updatedProd.nombre + "_"; // Asignar "EAN" único
            // }
            prodMap.set(updatedProd.ean, updatedProd);
        }
    }
    return prodMap;
};
exports.ProductosCSVToMap = ProductosCSVToMap;
const AddProductosToVentas = (ventas, productosVenta, productosDB) => {
    let workSheets = {};
    let sName = "";
    const workbook = xlsx_1.default.readFile(`${productosVenta}`);
    const ventasUpdated = new Map();
    for (const sheetName of workbook.SheetNames) {
        sName = sheetName;
        workSheets[sheetName] = xlsx_1.default.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }
    const prodPorVentas = workSheets[sName];
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
        let producto = prodEnDBEAN ? prodEnDBEAN : prodEnDBNombre;
        if (!producto) {
            producto = productoVendido;
        }
        if (!producto) {
            continue;
        }
        const prod = (0, exports.CrearProductoVendido)(productoVendido, producto); // Cambiar la _id por la interna de mongo
        const venta = ventas.get(prod.idVenta);
        if (venta) {
            venta.productos.push(prod);
            ventasUpdated.set(venta.id, venta);
        }
    }
    return ventasUpdated;
};
exports.AddProductosToVentas = AddProductosToVentas;
const CrearVenta = (v) => {
    if (v.total <= 0) {
        return undefined;
    }
    let tipo = v.isTarjeta == 1 ? TipoVenta.Tarjeta : TipoVenta.Efectivo;
    let cambio = v.cambio;
    if (v.cambio < 0) {
        cambio = 0;
        tipo = TipoVenta.CobroRapido;
    }
    if (v.cambio > 0 && v.cambio < 0.01) {
        cambio = 0;
    }
    const fecha = (0, exports.strToDate)(v.fecha, String(v.hora));
    const updatedVenta = {
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
    };
    return updatedVenta;
};
exports.CrearVenta = CrearVenta;
const CrearProducto = (p) => {
    const ean = p.EAN || p.ean;
    const prod = {
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
    };
    return prod;
};
exports.CrearProducto = CrearProducto;
const CrearProductoVendido = (productoEnVenta, productoEnDb) => {
    const precioConIva = (productoEnDb.precioCompra * (productoEnVenta.iva / 100));
    const margen = (productoEnVenta.precioConIva - precioConIva) / precioConIva;
    const prod = {
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
    };
    return prod;
};
exports.CrearProductoVendido = CrearProductoVendido;
let productosMap = (0, exports.ProductosCSVToMap)("productos.csv");
let ventasMap = (0, exports.VentaXLSXToMap)("ventas.xlsx");
ventasMap = (0, exports.AddProductosToVentas)(ventasMap, "productosPorVenta.xlsx", productosMap);
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
fs_1.default.writeFile("ventasJsonTPV.json", JSON.stringify(ventas), function (err) {
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
