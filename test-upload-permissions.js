// Test upload directory permissions
const fs = require('fs');
const path = require('path');

async function testUploadPermissions() {
  console.log('🔍 Testing Upload Directory Permissions\n');
  console.log('='.repeat(60));

  const uploadDir = path.join(process.cwd(), 'uploads');
  const testDir = path.join(uploadDir, 'tickets', 'test-ticket-id');
  const testFile = path.join(testDir, 'test-file.txt');

  try {
    // 1. Check if uploads directory exists
    console.log('\n1️⃣ Checking uploads directory...');
    console.log(`   Path: ${uploadDir}`);
    if (fs.existsSync(uploadDir)) {
      console.log('   ✅ Directory exists');
      
      // Check permissions
      try {
        fs.accessSync(uploadDir, fs.constants.W_OK);
        console.log('   ✅ Directory is writable');
      } catch (error) {
        console.log('   ❌ Directory is NOT writable');
        console.log('   Error:', error.message);
      }
    } else {
      console.log('   ❌ Directory does NOT exist');
      console.log('   Creating directory...');
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('   ✅ Directory created');
    }

    // 2. Try to create subdirectory
    console.log('\n2️⃣ Testing subdirectory creation...');
    console.log(`   Path: ${testDir}`);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
      console.log('   ✅ Subdirectory created');
    } else {
      console.log('   ✅ Subdirectory already exists');
    }

    // 3. Try to write a test file
    console.log('\n3️⃣ Testing file write...');
    console.log(`   Path: ${testFile}`);
    fs.writeFileSync(testFile, 'This is a test file');
    console.log('   ✅ File written successfully');

    // 4. Try to read the file
    console.log('\n4️⃣ Testing file read...');
    const content = fs.readFileSync(testFile, 'utf8');
    console.log(`   ✅ File read successfully: "${content}"`);

    // 5. Try to delete the file
    console.log('\n5️⃣ Testing file deletion...');
    fs.unlinkSync(testFile);
    console.log('   ✅ File deleted successfully');

    // 6. Clean up test directory
    console.log('\n6️⃣ Cleaning up...');
    fs.rmdirSync(testDir);
    console.log('   ✅ Test directory removed');

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ All upload permission tests passed!');
    console.log('   The uploads directory is working correctly.');

  } catch (error) {
    console.error('\n❌ Upload permission test failed!');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
    
    console.log('\n💡 Possible solutions:');
    console.log('   1. Check directory permissions');
    console.log('   2. Run the application with appropriate permissions');
    console.log('   3. Ensure the uploads directory is not read-only');
  }
}

testUploadPermissions();
