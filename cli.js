const readlineSync = require('readline-sync');
const DownDetector = require("./downdetector");

const detector = new DownDetector();
const fs = require('fs');
const siteDict = require('./dict');

let lastData = null;

async function requestSite() {
    const site = readlineSync.question("\nEnter Service to check (or '/q', '/ex' to quit): ");

    const siteDir = (siteDict[site.toLowerCase()] || site).toLowerCase();

    if (siteDir.toLowerCase() === "exit" || siteDir.toLowerCase() === "/q" || siteDir.toLowerCase() === "/ex") {
        process.stdout.write("\nPress any key to exit...");
        process.exit();
    } else if (siteDir.length < 1) {
        process.stdout.write("\nService name must be at least 1 character long.\n");
        requestSite();
    } else {
        console.clear();
        process.stdout.write("\nChecking Service: " + siteDir + "\n");
        lastData = await detector.detect(siteDir);
        process.stdout.write("\nMost Common Problems reported by Users:\n");
        lastData.problems.forEach((problem, index) => {
            process.stdout.write(`Problem: ${problem.Problem}, Affected by: ${problem.Affected}\n`);
        });
        process.stdout.write("\nService Website: " + lastData.url + "\n");
        if (lastData.valueInTextDanger) {
            process.stdout.write(lastData.valueInTextDanger + "\n");
        } else {
            process.stdout.write("\nCould not find the Last Downtime for: " + lastData.site + "\n");
        }
        requestSite();
    }
}

requestSite();

