import ExcelJS from 'exceljs';

export interface EmployeeExportRow {
  employeeId: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  department: string;
  designation: string;
  joiningDate: string;
  branchName: string;
  shiftName: string;
  baseSalary: number;
  status: string;
}

export const exportEmployeesToExcel = async (employees: EmployeeExportRow[]): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Employees');

  worksheet.columns = [
    { header: 'Employee ID', key: 'employeeId', width: 15 },
    { header: 'Full Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Mobile', key: 'mobile', width: 15 },
    { header: 'Address', key: 'address', width: 30 },
    { header: 'Department', key: 'department', width: 15 },
    { header: 'Designation', key: 'designation', width: 15 },
    { header: 'Joining Date', key: 'joiningDate', width: 15 },
    { header: 'Branch', key: 'branchName', width: 15 },
    { header: 'Shift', key: 'shiftName', width: 15 },
    { header: 'Base Salary', key: 'baseSalary', width: 15 },
    { header: 'Status', key: 'status', width: 12 }
  ];

  // Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF142E5C' } // Dark blue theme
  };

  employees.forEach((emp) => {
    worksheet.addRow(emp);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as any);
};

export const parseEmployeesFromExcel = async (fileBuffer: Buffer): Promise<any[]> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer as any);
  const worksheet = workbook.worksheets[0];
  const data: any[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip headers
    
    // row.values is 1-indexed, cell 1 is col A, etc.
    const values = row.values as any[];
    if (!values || values.length <= 1) return;
    
    const getVal = (idx: number) => {
      const cell = values[idx];
      if (cell && typeof cell === 'object' && 'text' in cell) {
        return cell.text;
      }
      return cell !== undefined && cell !== null ? cell.toString() : '';
    };

    data.push({
      employeeId: getVal(1),
      name: getVal(2),
      email: getVal(3),
      mobile: getVal(4),
      address: getVal(5),
      department: getVal(6),
      designation: getVal(7),
      joiningDate: getVal(8) ? new Date(getVal(8)) : new Date(),
      branchName: getVal(9),
      shiftName: getVal(10),
      baseSalary: parseFloat(getVal(11) || '0')
    });
  });

  return data;
};
export const exportToCsvBuffer = async (columns: { header: string; key: string }[], rows: any[]): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');
  worksheet.columns = columns.map(c => ({ header: c.header, key: c.key }));
  rows.forEach(r => worksheet.addRow(r));
  const buffer = await workbook.csv.writeBuffer();
  return Buffer.from(buffer as any);
};
export const exportToExcelBuffer = async (sheetName: string, columns: { header: string; key: string }[], rows: any[]): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.columns = columns.map(c => ({ header: c.header, key: c.key }));
  rows.forEach(r => worksheet.addRow(r));
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as any);
};
