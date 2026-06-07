import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface PayslipData {
  organizationName: string;
  branchName: string;
  employeeName: string;
  employeeId: string;
  department: string;
  designation: string;
  month: string;
  baseSalary: number;
  overtimePay: number;
  bonus: number;
  incentives: number;
  leaveDeductions: number;
  latePenalties: number;
  otherDeductions: number;
  netSalary: number;
}

export const generatePayslipPdf = async (data: PayslipData): Promise<Buffer> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const { width, height } = page.getSize();
  
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const primaryColor = rgb(0.08, 0.18, 0.36);
  const secondaryColor = rgb(0.3, 0.3, 0.3);
  const lightGrey = rgb(0.95, 0.95, 0.95);
  const borderGrey = rgb(0.8, 0.8, 0.8);

  // Header Banner
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width,
    height: 100,
    color: primaryColor,
  });

  page.drawText('KARMSETU WORKFORCE PLATFORM', {
    x: 40,
    y: height - 55,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('MONTHLY SALARY PAYSLIP', {
    x: 40,
    y: height - 80,
    size: 12,
    font: fontRegular,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Org Info
  page.drawText(data.organizationName.toUpperCase(), {
    x: 40,
    y: height - 140,
    size: 16,
    font: fontBold,
    color: primaryColor,
  });

  page.drawText(`Branch: ${data.branchName}`, {
    x: 40,
    y: height - 160,
    size: 10,
    font: fontRegular,
    color: secondaryColor,
  });

  page.drawText(`Pay Period: ${data.month}`, {
    x: 400,
    y: height - 140,
    size: 12,
    font: fontBold,
    color: primaryColor,
  });

  page.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
    x: 400,
    y: height - 160,
    size: 10,
    font: fontRegular,
    color: secondaryColor,
  });

  // Divider
  page.drawLine({
    start: { x: 40, y: height - 180 },
    end: { x: 560, y: height - 180 },
    thickness: 1,
    color: borderGrey,
  });

  // Employee details
  page.drawText('EMPLOYEE DETAILS', {
    x: 40,
    y: height - 210,
    size: 11,
    font: fontBold,
    color: primaryColor,
  });

  const detailsY = height - 230;
  const col1 = 40;
  const col2 = 320;

  page.drawText(`Employee Name: ${data.employeeName}`, { x: col1, y: detailsY, size: 9, font: fontRegular });
  page.drawText(`Employee ID  : ${data.employeeId}`, { x: col2, y: detailsY, size: 9, font: fontRegular });

  page.drawText(`Designation  : ${data.designation}`, { x: col1, y: detailsY - 20, size: 9, font: fontRegular });
  page.drawText(`Department   : ${data.department}`, { x: col2, y: detailsY - 20, size: 9, font: fontRegular });

  // Divider
  page.drawLine({
    start: { x: 40, y: detailsY - 35 },
    end: { x: 560, y: detailsY - 35 },
    thickness: 1,
    color: borderGrey,
  });

  // Salary Tables
  const tableY = detailsY - 65;
  page.drawText('EARNINGS', { x: col1, y: tableY, size: 11, font: fontBold, color: primaryColor });
  page.drawText('DEDUCTIONS', { x: col2, y: tableY, size: 11, font: fontBold, color: primaryColor });

  const earnY = tableY - 25;
  const drawAmountRow = (label: string, val: number, x: number, y: number) => {
    page.drawText(label, { x, y, size: 9, font: fontRegular });
    page.drawText(`INR ${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, { x: x + 130, y, size: 9, font: fontRegular });
  };

  // Earnings Rows
  drawAmountRow('Base Salary', data.baseSalary, col1, earnY);
  drawAmountRow('Overtime Pay', data.overtimePay, col1, earnY - 20);
  drawAmountRow('Bonus', data.bonus, col1, earnY - 40);
  drawAmountRow('Incentives', data.incentives, col1, earnY - 60);

  // Deductions Rows
  drawAmountRow('Leave Deductions', data.leaveDeductions, col2, earnY);
  drawAmountRow('Late Penalties', data.latePenalties, col2, earnY - 20);
  drawAmountRow('Other Deductions', data.otherDeductions, col2, earnY - 40);

  // Total Earnings & Total Deductions
  const totEarnings = data.baseSalary + data.overtimePay + data.bonus + data.incentives;
  const totDeductions = data.leaveDeductions + data.latePenalties + data.otherDeductions;

  page.drawLine({ start: { x: 40, y: earnY - 75 }, end: { x: 560, y: earnY - 75 }, thickness: 0.5, color: borderGrey });

  drawAmountRow('Total Earnings', totEarnings, col1, earnY - 90);
  drawAmountRow('Total Deductions', totDeductions, col2, earnY - 90);

  // Divider
  page.drawLine({
    start: { x: 40, y: earnY - 110 },
    end: { x: 560, y: earnY - 110 },
    thickness: 1.5,
    color: primaryColor,
  });

  // Net Salary
  const netY = earnY - 140;
  page.drawRectangle({
    x: 40,
    y: netY - 15,
    width: 520,
    height: 40,
    color: lightGrey,
  });

  page.drawText('NET TAKE HOME PAY', {
    x: 60,
    y: netY,
    size: 11,
    font: fontBold,
    color: primaryColor,
  });

  page.drawText(`INR ${data.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, {
    x: 380,
    y: netY,
    size: 13,
    font: fontBold,
    color: primaryColor,
  });

  // Footer notes
  page.drawText('This is a computer-generated document and does not require a signature.', {
    x: 140,
    y: 60,
    size: 8,
    font: fontRegular,
    color: secondaryColor,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
