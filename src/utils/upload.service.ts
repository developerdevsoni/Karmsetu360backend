import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure standard storage structure directories exist
const dirs = [
  'uploads/organizations',
  'uploads/employees',
  'uploads/documents',
  'uploads/payslips'
];

dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine folder location using custom request header or body field
    const uploadType = req.headers['x-upload-type'] || req.body.uploadType || 'documents';
    
    let dest = 'uploads/documents';
    if (uploadType === 'organization') {
      dest = 'uploads/organizations';
    } else if (uploadType === 'employee') {
      dest = 'uploads/employees';
    } else if (uploadType === 'payslip') {
      dest = 'uploads/payslips';
    }
    
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Uploaded file extension is not permitted. Only images, PDFs, word docs, and spreadsheets are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});
