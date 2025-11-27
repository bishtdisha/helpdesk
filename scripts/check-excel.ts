import * as XLSX from 'xlsx';
import * as path from 'path';

async function checkExcel() {
  try {
    console.log('📂 Reading Excel file...');
    
    const filePath = path.join('d:', 'v0-odoo', 'odoo Team Excel.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log('📄 Sheet name:', sheetName);
    
    // Convert to JSON
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`\n📊 Total rows: ${data.length}`);
    console.log('\n📋 Column names:');
    if (data.length > 0) {
      Object.keys(data[0]).forEach((key, index) => {
        console.log(`  ${index + 1}. ${key}`);
      });
      
      console.log('\n📝 Sample data (first 3 rows):');
      data.slice(0, 3).forEach((row, index) => {
        console.log(`\nRow ${index + 1}:`);
        console.log(JSON.stringify(row, null, 2));
      });
    }
    
  } catch (error) {
    console.error('❌ Error reading Excel:', error);
  }
}

checkExcel();
