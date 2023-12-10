require("dotenv").config();
const express = require("express");
const { updateDataToDate } = require("./cron");
const app = express();
const PORT = process.env.PORT || 3000
const path = require('path');
// const acq = require('./acquisitions')

setInterval(async () => await updateDataToDate(), 1000*60*60*24)

// app.get('/acquisitions.js',(req, res) => {
//     res.send(acq)
// })
app.get('/entryExitData', (req,res)=> {
    const entryExitData = require('./historicalData.json')
    res.json(entryExitData);
})
app.get('/', (req,res)=> {
    const indexPath = path.join(__dirname, 'index.html');

    // Send the index.html file
    res.sendFile(indexPath);
})

app.listen(PORT, () => console.log(`server started on port ${PORT}`))

