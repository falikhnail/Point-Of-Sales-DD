import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const exportToPDF = (
  title: string,
  headers: string[],
  data: (string | number)[][],
  filename: string
) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 20);

  // Add date
  doc.setFontSize(10);
  doc.text(
    `Dicetak: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })}`,
    14,
    30
  );

  // Add table
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 40,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [249, 115, 22], // Orange color
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [255, 247, 237], // Light orange
    },
  });

  doc.save(filename);
};

export const exportToExcel = (
  data: Record<string, string | number>[],
  filename: string,
  sheetName: string = "Data"
) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = Object.keys(data[0] || {}).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...data.map((row) => String(row[key] || "").length)
    );
    return { wch: Math.min(maxLength + 2, maxWidth) };
  });
  worksheet["!cols"] = colWidths;

  XLSX.writeFile(workbook, filename);
};

export const printReport = (elementId: string) => {
  const printContent = document.getElementById(elementId);
  if (!printContent) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f97316;
            color: white;
          }
          tr:nth-child(even) {
            background-color: #fff7ed;
          }
          h1 {
            color: #f97316;
          }
          @media print {
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};