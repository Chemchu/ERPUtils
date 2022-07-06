"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xlsx_1 = __importDefault(require("xlsx"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const extension = '.xlsx';
const returnFileNameProveedores = 'ProveedoresComparados.xlsx';
const ubicacionProveedoresComp = './src/utils/transformProductsToJson/' + returnFileNameProveedores;
const nombreXLSXTienda = "Tienda.xlsx";
const files = fs_1.default.readdirSync('./src/utils/transformProductsToJson/');
const targetFiles = files.filter(file => {
    return path_1.default.extname(file).toLowerCase() === extension && file != returnFileNameProveedores;
});
const XLSXToProductoArray = (fileName) => {
    let workSheets = {};
    let sName = "";
    const workbook = xlsx_1.default.readFile(`./src/utils/transformProductsToJson/${fileName}`);
    for (const sheetName of workbook.SheetNames) {
        sName = sheetName;
        workSheets[sheetName] = xlsx_1.default.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }
    const productos = workSheets[sName];
    let productsObject = [];
    for (let index = 0; index < productos.length; index++) {
        const producto = productos[index];
        if (!producto.EAN) {
            continue;
        }
        if (!producto.Nombre) {
            continue;
        }
        if (isNaN(producto.Precio)) {
            continue;
        }
        const precio = isNaN(producto.Precio) ? Number(String(producto.Precio).substring(0, String(producto.Precio).length - 1)) : producto.Precio;
        if (isNaN(precio)) {
            continue;
        }
        const updatedProd = {
            NombreProveedor: fileName,
            EAN: producto.EAN,
            Nombre: producto.Nombre,
            Precio: precio
        };
        productsObject.push(updatedProd);
    }
    return productsObject;
};
const CompararPrecios = (proveedor1, proveedor2) => {
    const cheaperPrices = new Map();
    for (let index = 0; index < proveedor1.length; index++) {
        cheaperPrices.set(proveedor1[index].EAN, proveedor1[index]);
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
};
const CrearProductXLSX = (principal) => {
    let prodPrincipal = XLSXToProductoArray(principal);
    const newBook2 = xlsx_1.default.utils.book_new();
    const newSheet2 = xlsx_1.default.utils.json_to_sheet(prodPrincipal);
    xlsx_1.default.utils.book_append_sheet(newBook2, newSheet2, "Sheet1");
    xlsx_1.default.writeFile(newBook2, "./src/utils/transformProductsToJson/productos.xlsx");
};
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
