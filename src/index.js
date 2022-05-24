"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = 5000;
app.use((req, res, next) => {
    console.log('Time: ', Date.now());
    next();
});
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.post('/', function (req, res) {
    const body = JSON.parse(req.body);
    console.log("Got a POST request for the homepage");
    res.send('Hello POST');
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
