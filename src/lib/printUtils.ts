import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const printReceipt = async () => {
  const printContent = document.getElementById('printable-receipt');
  if (!printContent) {
    console.error('Print content not found');
    return;
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Could not open print window');
    return;
  }

  // Clone the content
  const clonedContent = printContent.cloneNode(true) as HTMLElement;
  
  // Write to the new window
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Receipt</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: monospace;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            @page {
              size: 80mm auto;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        ${clonedContent.outerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
};

export const downloadReceiptAsPDF = async () => {
  const printContent = document.getElementById('printable-receipt');
  if (!printContent) {
    console.error('Print content not found');
    return;
  }

  try {
    // Capture the element as canvas
    const canvas = await html2canvas(printContent, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png');

    // Create PDF with thermal printer dimensions (80mm width)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, canvas.height * 80 / canvas.width],
    });

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, 0, 80, canvas.height * 80 / canvas.width);

    // Generate filename with timestamp
    const timestamp = new Date().getTime();
    const filename = `struk-${timestamp}.pdf`;

    // Download the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};