"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const transformSalesToJson_1 = require("../transformSalesToJson");
const fs_1 = __importDefault(require("fs"));
// No termina nunca de calcular. OPTIMIZAR
const PurgarProductos = (productosEnDb, ventas) => {
    const productosVendidos = new Map();
    for (let i = 0; ventas.length; i++) {
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
    const productosEan = Array.from(productosEnDb.keys());
    for (let index = 0; index < productosEan.length; index++) {
        if (!productosVendidos.has(productosEan[index])) {
            productosEnDb.delete(productosEan[index]);
        }
    }
    return Array.from(productosEnDb.values());
};
let productosMap = (0, transformSalesToJson_1.ProductosCSVToMap)("productos.csv");
let ventasSinProdMap = (0, transformSalesToJson_1.VentaXLSXToMap)("ventas.xlsx");
const ventasConProdMap = (0, transformSalesToJson_1.AddProductosToVentas)(ventasSinProdMap, "productosPorVenta.xlsx", productosMap);
const prodEanFixed = Array.from(productosMap.values());
let prodMap = new Map();
for (let i = 0; i < prodEanFixed.length; i++) {
    prodMap.set(prodEanFixed[i].ean, prodEanFixed[i]);
}
let ventas = [];
ventasConProdMap.forEach((venta, id) => {
    ventas.push(venta);
});
console.log(prodMap.size);
const productosPurgados = PurgarProductos(prodMap, ventas);
console.log(productosPurgados.length);
fs_1.default.writeFile("productosPurgados.json", JSON.stringify(productosPurgados), function (err) {
    if (err) {
        console.log(err);
    }
});
