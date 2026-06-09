import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import Visitor from '../models/Visitor.js';

const formatRow = (visitor) => ({
  token: visitor.tokenNumber,
  name: visitor.name,
  mobile: visitor.mobile,
  company: visitor.company,
  purpose: visitor.purpose || '',
  date: new Date(visitor.visitDate).toLocaleDateString(),
  time: new Date(visitor.createdAt).toLocaleTimeString(),
});

export const exportToExcel = async (visitors) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Visitors');

  sheet.columns = [
    { header: 'Token', key: 'token', width: 10 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Mobile', key: 'mobile', width: 15 },
    { header: 'Company', key: 'company', width: 25 },
    { header: 'Purpose', key: 'purpose', width: 30 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Time', key: 'time', width: 15 },
  ];

  sheet.getRow(1).font = { bold: true };

  visitors.forEach((v) => sheet.addRow(formatRow(v)));

  return workbook.xlsx.writeBuffer();
};

export const exportToPDF = (visitors) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('Visitor Report', { align: 'center' });
    doc.moveDown();

    const headers = ['Token', 'Name', 'Mobile', 'Company', 'Date', 'Time'];
    const colWidths = [50, 120, 90, 120, 80, 80];
    let y = doc.y;

    doc.fontSize(10).font('Helvetica-Bold');
    let x = 40;
    headers.forEach((h, i) => {
      doc.text(h, x, y, { width: colWidths[i] });
      x += colWidths[i];
    });

    y += 20;
    doc.font('Helvetica');

    visitors.forEach((visitor) => {
      if (y > 520) {
        doc.addPage();
        y = 40;
      }
      const row = formatRow(visitor);
      x = 40;
      [row.token, row.name, row.mobile, row.company, row.date, row.time].forEach((cell, i) => {
        doc.text(String(cell), x, y, { width: colWidths[i], ellipsis: true });
        x += colWidths[i];
      });
      y += 18;
    });

    doc.end();
  });

export const fetchVisitorsForExport = async (filters) => {
  const query = buildQuery(filters);
  return Visitor.find(query).sort({ createdAt: -1 });
};

const buildQuery = (filters) => {
  const query = {};
  if (filters.search) {
    const regex = new RegExp(filters.search, 'i');
    query.$or = [
      { name: regex },
      { mobile: regex },
      { tokenNumber: regex },
      { company: regex },
    ];
  }
  if (filters.date) {
    const start = new Date(filters.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.date);
    end.setHours(23, 59, 59, 999);
    query.visitDate = { $gte: start, $lte: end };
  }
  return query;
};
