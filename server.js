const express = require('express');
const bodyParser = require('body-parser');
const DownDetector = require('./downdetector');
const path = require('path');
const siteDict = require('./dict');

const app = express();
const port = 8085;

const detector = new DownDetector();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.post('/detect', async (req, res) => {
    let site = req.body.site;
    if (site) {
        site = (siteDict[site.toLowerCase()] || site).toLowerCase();
        try {
            const result = await detector.detect(site, 'server');
            const resultCopy = JSON.parse(JSON.stringify(result));
            delete resultCopy.chart;
            delete resultCopy.valueInTextDanger;

            res.send(`
                <h1>Results for ${site}</h1>
                <h2>${result.valueInTextDanger}</h2>
                <pre>${JSON.stringify(resultCopy, null, 2)}</pre>
                <a href="/">Back</a>
            `);
        } catch (error) {
            console.error("Error occurred:", error);
            res.status(500).send("Internal Server Error :(");
        }
    } else {
        res.send("NO SERVICE MENTIONED :(");
    }
});

app.listen(port, (err) => {
    if (err) {
        console.error("ERROR \n", err);
    } else {
        console.log("[+] Starting Local Server on:", port);
        console.log("[+] Local Server ready: ", "http://localhost:" + port);
        console.log("[i] Only use the Local Server if you know what you're doing.")
        console.log("[i] For normal usage, please use the CLI interface.")
    }
});
