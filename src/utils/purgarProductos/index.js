"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const transformSalesToJson_1 = require("../transformSalesToJson");
const fs_1 = __importDefault(require("fs"));
const xlsx_1 = __importDefault(require("xlsx"));
const PurgarProductos = (productosEnDb, ventas) => {
    const productosVendidos = new Map();
    for (let i = 0; i < ventas.length; i++) {
        if (!ventas[i]) {
            continue;
        }
        for (let j = 0; j < ventas[i].productos.length; j++) {
            if (productosVendidos.has(ventas[i].productos[j].ean)) {
                continue;
            }
            productosVendidos.set(ventas[i].productos[j].ean, ventas[i].productos[j]);
        }
    }
    const productosFinal = new Map();
    productosEnDb.forEach((producto, ean) => {
        if (productosVendidos.has(ean) && !productosFinal.has(ean)) {
            productosFinal.set(ean, producto);
        }
    });
    return Array.from(productosFinal.values());
};
let productosMap = (0, transformSalesToJson_1.ProductosCSVToMap)("productos.csv");
let ventasMap = (0, transformSalesToJson_1.VentaXLSXToMap)("ventas.xlsx");
(0, transformSalesToJson_1.AddProductosToVentas)(ventasMap, "productosPorVenta.xlsx", productosMap);
const prodEanFixed = Array.from(productosMap.values());
let prodMap = new Map();
for (let i = 0; i < prodEanFixed.length; i++) {
    prodMap.set(prodEanFixed[i].ean, prodEanFixed[i]);
}
let ventas = [];
ventasMap.forEach((venta, id) => {
    ventas.push(venta);
});
const productosPurgados = PurgarProductos(prodMap, ventas);
const productosWorksheet = xlsx_1.default.utils.json_to_sheet(productosPurgados);
const csv = xlsx_1.default.utils.sheet_to_csv(productosWorksheet);
fs_1.default.writeFile("productosPurgados.csv", csv, function (err) {
    if (err) {
        console.log(err);
    }
});
