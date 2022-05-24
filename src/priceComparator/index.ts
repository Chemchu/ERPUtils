import XLSX from "xlsx";
import { ProductoXLSX as Producto } from "../../types";
import path from 'path';
import fs from 'fs';

const extension = '.xlsx';
const returnFileNameProveedores = 'ProveedoresComparados.xlsx';
const ubicacionProveedoresComp = './src/priceComparator/' + returnFileNameProveedores;
const nombreXLSXTienda = "Tienda.xlsx";

const files = fs.readdirSync('./src/priceComparator/');
const targetFiles = files.filter(file => {
    return path.extname(file).toLowerCase() === extension && file != returnFileNameProveedores;
});

const XLSXToProductoArray = (fileName: string): Producto[] => {
    let workSheets: XLSX.WorkSheet = {}
    let sName = "";
    const workbook: XLSX.WorkBook = XLSX.readFile(`./src/priceComparator/${fileName}`);

    for (const sheetName of workbook.SheetNames) {
        sName = sheetName;
        workSheets[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    const productos = workSheets[sName] as Producto[];
    let productsObject: Producto[] = [];

    for (let index = 0; index < productos.length; index++) {
        const producto = productos[index];

        if (!producto.EAN) { continue; }
        if (!producto.Nombre) { continue; }
        if (isNaN(producto.Precio)) { continue; }

        const precio = isNaN(producto.Precio) ? Number(String(producto.Precio).substring(0, String(producto.Precio).length - 1)) : producto.Precio;

        if (isNaN(precio)) {
            continue;
        }

        const updatedProd: Producto = {
            NombreProveedor: fileName,
            EAN: producto.EAN,
            Nombre: producto.Nombre,
            Precio: precio
        }

        productsObject.push(updatedProd);
    }

    return productsObject;
}

const CompararPrecios = (proveedor1: Producto[], proveedor2: Producto[]): Producto[] => {
    const cheaperPrices: Map<string, Producto> = new Map<string, Producto>();

    for (let index = 0; index < proveedor1.length; index++) {
        cheaperPrices.set(proveedor1[index].EAN, proveedor1[index])
    }

    for (let index = 0; index < proveedor2.length; index++) {
        if (cheaperPrices.has(proveedor2[index].EAN)) {
            const prodInMap = cheaperPrices.get(proveedor2[index].EAN);

            if (prodInMap) {
                const prod = prodInMap.Precio > proveedor2[index].Precio ? proveedor2[index] : prodInMap;
                cheaperPrices.set(prod.EAN, prod);
                continue;
            }
        }

        cheaperPrices.set(proveedor2[index].EAN, proveedor2[index]);
    }

    return Array.from(cheaperPrices.values());
}

const CompararProductosPropios = (principal: string, proveedores: Producto[]) => {
    let prodPrincipal: Producto[] = XLSXToProductoArray(principal);
    const productosProveedores: Map<string, Producto> = new Map<string, Producto>();

    for (let index = 0; index < proveedores.length; index++) {
        productosProveedores.set(proveedores[index].EAN, proveedores[index]);
    }

    let productosMasBaratos: Producto[] = [];

    prodPrincipal.forEach(prodTienda => {
        let prodProveedor = productosProveedores.get(prodTienda.EAN);

        if (prodProveedor) {
            prodProveedor.Diferencia = Number(prodTienda.Precio) === 0 ? "¿?" : Number(prodTienda.Precio) - Number(prodProveedor.Precio);
            productosMasBaratos.push(prodProveedor);
        }
    });

    const TiendaProveedorMasBarato = productosMasBaratos;

    const newBook2 = XLSX.utils.book_new();
    const newSheet2 = XLSX.utils.json_to_sheet(TiendaProveedorMasBarato);
    XLSX.utils.book_append_sheet(newBook2, newSheet2, "Sheet1");
    XLSX.writeFile(newBook2, "./src/priceComparator/ReferenciasMasBaratas.xlsx");
}

const CalcularMasBaratos = (files: string[]): Producto[] => {
    let prodTotal: Producto[] = [];
    for (let index = 0; index < files.length; index++) {
        if (files[index] === nombreXLSXTienda) { continue; }

        if (index === 0) {
            prodTotal = XLSXToProductoArray(files[index]);
            continue;
        }
        const productosFile = XLSXToProductoArray(files[index]);
        prodTotal = CompararPrecios(prodTotal, productosFile);
    }

    const newBook = XLSX.utils.book_new();
    const newSheet = XLSX.utils.json_to_sheet(prodTotal);
    XLSX.utils.book_append_sheet(newBook, newSheet, "Sheet1");
    XLSX.writeFile(newBook, ubicacionProveedoresComp);

    return prodTotal;
}

CompararProductosPropios(nombreXLSXTienda, CalcularMasBaratos(targetFiles));

// Modify the XLSX
    // worksheets[sName].push({
    //     "First Name": "Bob",
    //     "Last Name": "Bob",
    //     "Gender": "Male",
    //     "Country": "United States",
    //     "Age": 35,
    //     "Date": "22/09/2020",
    //     "Id": 1600,
    //     "New Column": "test"
    // });