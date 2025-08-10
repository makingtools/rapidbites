import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Function to trigger file download
const downloadFile = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

export const exportToPdf = (columns: { header: string; dataKey: string }[], data: any[], title: string) => {
    const doc = new jsPDF();
    doc.text(title, 14, 16);
    autoTable(doc, {
        head: [columns.map(c => c.header)],
        body: data.map(row => columns.map(col => row[col.dataKey] ?? '')),
        startY: 24
    });
    const blob = doc.output('blob');
    downloadFile(blob, `${title.toLowerCase().replace(/ /g, '_')}.pdf`);
};

export const exportToXlsx = (data: any[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    downloadFile(blob, filename);
};