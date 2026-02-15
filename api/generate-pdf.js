const chrome = require('chrome-aws-lambda');

module.exports = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let browser = null;

    try {
        const { html, filename } = req.body;

        if (!html) {
            return res.status(400).json({ error: 'HTML content is required' });
        }

        // Launch headless Chrome using chrome-aws-lambda
        browser = await chrome.puppeteer.launch({
            args: chrome.args,
            defaultViewport: chrome.defaultViewport,
            executablePath: await chrome.executablePath,
            headless: chrome.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();

        // Set the HTML content
        await page.setContent(html, {
            waitUntil: ['networkidle0', 'load'],
            timeout: 30000,
        });

        // Wait a bit for fonts to load
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generate PDF with print CSS
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: false,
            margin: {
                top: '5mm',
                right: '5mm',
                bottom: '5mm',
                left: '5mm',
            },
        });

        await browser.close();
        browser = null;

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'invoice.pdf'}"`);
        res.setHeader('Content-Length', pdf.length);
        res.send(pdf);

    } catch (error) {
        console.error('PDF Generation Error:', error);

        // Make sure browser is closed
        if (browser) {
            await browser.close();
        }

        res.status(500).json({
            error: 'Failed to generate PDF',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
