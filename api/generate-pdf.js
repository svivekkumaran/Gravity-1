const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { html, filename } = req.body;

        if (!html) {
            return res.status(400).json({ error: 'HTML content is required' });
        }

        // Launch headless Chrome
        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();

        // Set the HTML content
        await page.setContent(html, {
            waitUntil: 'networkidle0',
        });

        // Generate PDF with print CSS
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '5mm',
                right: '5mm',
                bottom: '5mm',
                left: '5mm',
            },
        });

        await browser.close();

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'invoice.pdf'}"`);
        res.send(pdf);

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    }
};
