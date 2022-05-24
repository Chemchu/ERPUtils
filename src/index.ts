import express from 'express';
const app = express()
const port = 5000

app.use((req, res, next) => {
    console.log('Time: ', Date.now());
    next();
});

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/', function (req, res) {
    const body = JSON.parse(req.body);

    console.log("Got a POST request for the homepage");
    res.send('Hello POST');
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})