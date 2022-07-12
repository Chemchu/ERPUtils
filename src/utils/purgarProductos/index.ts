import { Producto, ProductoVendido, Venta } from "../../../types";
import { AddProductosToVentas, ProductosCSVToMap, VentaXLSXToMap } from "../transformSalesToJson";
import fs from 'fs';

const PurgarProductos = (productosEnDb: Map<string, Producto>, ventas: Venta[]): Producto[] => {
    const productosVendidos: Map<string, ProductoVendido> = new Map()
    for (let i = 0; i < ventas.length; i++) {
        if (!ventas[i]) { continue; }

        for (let j = 0; j < ventas[i].productos.length; j++) {
            if (productosVendidos.has(ventas[i].productos[j].ean)) {
                continue;
            }
            productosVendidos.set(ventas[i].productos[j].ean, ventas[i].productos[j])
        }
    }
    const productosFinal: Map<string, Producto> = new Map()
    productosEnDb.forEach((producto, ean) => {
        if (productosVendidos.has(ean) && !productosFinal.has(ean)) {
            productosFinal.set(ean, producto)
        }
    })

    return Array.from(productosFinal.values())
}

let productosMap = ProductosCSVToMap("productos.csv")
let ventasMap = VentaXLSXToMap("ventas.xlsx");
AddProductosToVentas(ventasMap, "productosPorVenta.xlsx", productosMap);
const prodEanFixed = Array.from(productosMap.values())

let prodMap = new Map();
for (let i = 0; i < prodEanFixed.length; i++) {
    prodMap.set(prodEanFixed[i].ean, prodEanFixed[i])
}

let ventas: Venta[] = []
ventasMap.forEach((venta, id) => {
    ventas.push(venta)
})

const productosPurgados = PurgarProductos(prodMap, ventas)
fs.writeFile("productosPurgados.json", JSON.stringify(productosPurgados), function (err) {
    if (err) {
        console.log(err);
    }
});