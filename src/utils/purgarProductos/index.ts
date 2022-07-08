import { Producto, ProductoVendido, Venta } from "../../../types";
import { AddProductosToVentas, ProductosCSVToMap, VentaXLSXToMap } from "../transformSalesToJson";
import fs from 'fs';

// No termina nunca de calcular. OPTIMIZAR
const PurgarProductos = (productosEnDb: Map<string, Producto>, ventas: Venta[]): Producto[] => {
    const productosVendidos: Map<string, ProductoVendido> = new Map()
    for (let i = 0; ventas.length; i++) {
        if (!ventas[i]) { continue; }

        for (let j = 0; j < ventas[i].productos.length; j++) {
            if (productosVendidos.has(ventas[i].productos[j].ean)) {
                continue;
            }
            productosVendidos.set(ventas[i].productos[j].ean, ventas[i].productos[j])
        }
    }

    const productosEan = Array.from(productosEnDb.keys())
    for (let index = 0; index < productosEan.length; index++) {
        if (!productosVendidos.has(productosEan[index])) {
            productosEnDb.delete(productosEan[index])
        }
    }

    return Array.from(productosEnDb.values())
}

let productosMap = ProductosCSVToMap("productos.csv")
let ventasSinProdMap = VentaXLSXToMap("ventas.xlsx");
const ventasConProdMap = AddProductosToVentas(ventasSinProdMap, "productosPorVenta.xlsx", productosMap);
const prodEanFixed = Array.from(productosMap.values())

let prodMap = new Map();
for (let i = 0; i < prodEanFixed.length; i++) {
    prodMap.set(prodEanFixed[i].ean, prodEanFixed[i])
}

let ventas: Venta[] = []
ventasConProdMap.forEach((venta, id) => {
    ventas.push(venta)
})

console.log(prodMap.size);
const productosPurgados = PurgarProductos(prodMap, ventas)
console.log(productosPurgados.length);

fs.writeFile("productosPurgados.json", JSON.stringify(productosPurgados), function (err) {
    if (err) {
        console.log(err);
    }
});