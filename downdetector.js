const puppeteer = require("puppeteer");
const blessed = require('blessed');
const contrib = require('blessed-contrib');


class DownDetector {
    async detect(site, source) {
        try {
            const browser = await puppeteer.launch({
                headless: "new", // if you encounter problems change this to "headless: false, (only for cli.js)"
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });

            const page = await browser.newPage();
            await page.goto("https://xn--allestrungen-9ib.de/stoerung/" + site); 
            //await page.goto("https://downdetector.com/status/" + site); // Change this address to the version of downdetector.com for your country

            await page.waitForSelector("script");
            const chart = await page.evaluate(() => {
                let data = { "data": null}; //"baseline": null };
                document.querySelectorAll("script").forEach((elem) => {
                    if (elem.innerHTML.includes("window.DD.chartTranslations") && elem.innerHTML.includes("window.DD.currentServiceProperties")) {
                        const array = elem.innerText.replace(/ /g, "").replace(/\n/g, "").split("data:");
                        array.shift();
                        let data1 = array[0].slice(0, array[0].indexOf("],}") + 1).replace(/x/g, '"Time"').replace(/y/g, '"Reports"').replace(/'/g, '"').replace(",]", "]");
                        //let data2 = array[1].slice(0, array[1].indexOf("},}}")).replace(/x/g, '"Time"').replace(/y/g, '"Reports"').replace(/'/g, '"').replace(",]", "]");
                        data["data"] = JSON.parse(data1);
                        //data["baseline"] = JSON.parse(data2);
                    }
                });
                return data;
            });

            //console.log("Latest Data Reports:", chart);

            let problems = [];
            try {
                await page.waitForSelector(".indicatorChart_percentage", { timeout: 5000 });
                problems = await page.evaluate(() => {
                    const problemElements = document.querySelectorAll(".indicatorChart_percentage");
                    const Problems = document.querySelectorAll(".text-center.text-muted.indicatorChart_name");
                    const problemsData = [];

                    if (problemElements.length === Problems.length && problemElements.length > 0) {
                        problemElements.forEach((element, index) => {
                            const Problem = Problems[index]?.textContent?.trim();
                            const Affected = element?.textContent?.trim();  //.replace("%", "")
                            if (Problem && Affected) {
                                problemsData.push({
                                    Problem,
                                    Affected
                                });
                            }
                        });
                    }
                    return problemsData;
                });
            } catch (error) {
                console.log('No problem data found');
            }


            //console.log("Problems:", problems);

            if (chart && chart.data && Array.isArray(chart.data)) {
                const graphData = {
                    title: 'Reports',
                    x: chart.data.map(item => {
                        const date = new Date(item.Time);
                        return `${date.getHours()}:${date.getMinutes() < 10 ? '0' : ''}${date.getMinutes()}`;
                    }),
                    y: chart.data.map(item => item.Reports)
                };

                const maxReports = Math.max(...graphData.y);
                const maxYValue = Math.ceil(maxReports / 10) * 10;

                var screen = blessed.screen();

                var line = contrib.line({
                    width: 120,
                    height: 30,
                    left: 3,
                    top: 3,
                    xPadding: 5,
                    label: 'Reports',
                    maxY: maxYValue
                });
                screen.append(line);

                line.setData([graphData]);
                screen.render();

                screen.on('resize', function () {
                    line.emit('attach');
                });
            }

            await page.waitForSelector("#company-status a");
            const url = await page.evaluate(() => {
                const anchor = document.querySelector("#company-status a");
                return anchor ? anchor.href : null;
            });
            //console.log("\nService Website:", url);


            let valueInTextDanger;
            try {
                await page.waitForSelector(".desktop-only", { timeout: 2500 });
                valueInTextDanger = await page.evaluate(() => {
                    const textDangerElement = document.querySelector(".h2.entry-title");
                    return textDangerElement ? textDangerElement.textContent.trim() : null;
                });
            } catch (error) {
                
            }

            /*
            if (!valueInTextDanger) {
                valueInTextDanger = await page.evaluate(() => {
                    const entryTitleElement = document.querySelector(".h2.entry-title");
                    return entryTitleElement ? entryTitleElement.textContent.trim() : null;
                });
            }
            */

            const myFinalObj = {
                url: url,
                problems: problems,
                chart: chart,
                valueInTextDanger: valueInTextDanger,
                site: site
            };

            await browser.close();

            return myFinalObj;
        } catch (error) {
            console.error("\nError occurred:", error);
            throw error;
        }
    }
}

module.exports = DownDetector;
