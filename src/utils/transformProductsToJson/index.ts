import XLSX from "xlsx";
import path from 'path';
import fs from 'fs';
import { ProductoXLSX } from "../../../types";

const extension = '.xlsx';
const returnFileNameProveedores = 'ProveedoresComparados.xlsx';
const ubicacionProveedoresComp = './src/utils/transformProductsToJson/' + returnFileNameProveedores;
const nombreXLSXTienda = "Tienda.xlsx";

const files = fs.readdirSync('./src/utils/transformProductsToJson/');
const targetFiles = files.filter(file => {
    return path.extname(file).toLowerCase() === extension && file != returnFileNameProveedores;
});

const XLSXToProductoArray = (fileName: string): ProductoXLSX[] => {
    let workSheets: XLSX.WorkSheet = {}
    let sName = "";
    const workbook: XLSX.WorkBook = XLSX.readFile(`./src/utils/transformProductsToJson/${fileName}`);

    for (const sheetName of workbook.SheetNames) {
        sName = sheetName;
        workSheets[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    const productos = workSheets[sName] as ProductoXLSX[];
    let productsObject: ProductoXLSX[] = [];

    for (let index = 0; index < productos.length; index++) {
        const producto = productos[index];

        if (!producto.EAN) { continue; }
        if (!producto.Nombre) { continue; }
        if (isNaN(producto.Precio)) { continue; }

        const precio = isNaN(producto.Precio) ? Number(String(producto.Precio).substring(0, String(producto.Precio).length - 1)) : producto.Precio;

        if (isNaN(precio)) {
            continue;
        }

        const updatedProd: ProductoXLSX = {
            NombreProveedor: fileName,
            EAN: producto.EAN,
            Nombre: producto.Nombre,
            Precio: precio
        }

        productsObject.push(updatedProd);
    }

    return productsObject;
}

const CompararPrecios = (proveedor1: ProductoXLSX[], proveedor2: ProductoXLSX[]): ProductoXLSX[] => {
    const cheaperPrices: Map<string, ProductoXLSX> = new Map<string, ProductoXLSX>();

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

const CrearProductXLSX = (principal: string) => {
    let prodPrincipal: ProductoXLSX[] = XLSXToProductoArray(principal);

    const newBook2 = XLSX.utils.book_new();
    const newSheet2 = XLSX.utils.json_to_sheet(prodPrincipal);
    XLSX.utils.book_append_sheet(newBook2, newSheet2, "Sheet1");
    XLSX.writeFile(newBook2, "./src/utils/transformProductsToJson/productos.xlsx");
}

// const CalcularMasBaratos = (files: string[]): ProductoXLSX[] => {
//     let prodTotal: ProductoXLSX[] = [];
//     for (let index = 0; index < files.length; index++) {
//         if (files[index] === nombreXLSXTienda) { continue; }

//         if (index === 0) {
//             prodTotal = XLSXToProductoArray(files[index]);
//             continue;
//         }
//         const productosFile = XLSXToProductoArray(files[index]);
//         prodTotal = CompararPrecios(prodTotal, productosFile);
//     }

//     const newBook = XLSX.utils.book_new();
//     const newSheet = XLSX.utils.json_to_sheet(prodTotal);
//     XLSX.utils.book_append_sheet(newBook, newSheet, "Sheet1");
//     XLSX.writeFile(newBook, ubicacionProveedoresComp);

//     return prodTotal;
// }

CrearProductXLSX(nombreXLSXTienda);

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