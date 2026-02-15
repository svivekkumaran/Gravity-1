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

        // Get API key from environment variable
        const apiKey = process.env.PDFSHIFT_API_KEY;

        if (!apiKey) {
            console.error('PDFSHIFT_API_KEY not configured');
            return res.status(500).json({
                error: 'PDF service not configured',
                details: 'Please add PDFSHIFT_API_KEY to environment variables'
            });
        }

        // Call PDFShift API
        const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`
            },
            body: JSON.stringify({
                source: html,
                format: 'A4',
                margin: '5mm',
                print_background: true,
                use_print: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('PDFShift API Error:', errorText);
            return res.status(response.status).json({
                error: 'Failed to generate PDF',
                details: errorText
            });
        }

        // Get PDF binary
        const pdfBuffer = await response.arrayBuffer();
        const pdf = Buffer.from(pdfBuffer);

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'invoice.pdf'}"`);
        res.setHeader('Content-Length', pdf.length);
        res.send(pdf);

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({
            error: 'Failed to generate PDF',
            details: error.message
        });
    }
};
