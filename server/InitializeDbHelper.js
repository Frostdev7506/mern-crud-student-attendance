const createUsersTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active'
  )
`;

// Create Admin Table
const createAdminsTableQuery = `
  CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'superadmin') DEFAULT 'admin',
    status ENUM('active', 'inactive') DEFAULT 'active'
  )
`;

// Create students table with additional 'status' column
const createStudentsTableQuery = `
  CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active'
  )
`;

// Create attendance table with additional 'status' column
const createAttendanceTableQuery = `
  CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    present BOOLEAN DEFAULT false,
    status ENUM('active', 'inactive') DEFAULT 'active'
  )
`;

// Add this SQL query to create the "messages" table if it doesn't exist
const createMessagesTableQuery = `
  CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const createTable = (tableName, createTableQuery, logStatement, dataBase) => {
  dataBase.query(createTableQuery, (err) => {
    if (err) {
      console.error(`Error creating ${tableName} table:`, err);
    } else {
      console.log(`${logStatement} table created or already exists`);
    }
  });
};

module.exports = {
  createAdminsTableQuery,
  createUsersTableQuery,
  createAttendanceTableQuery,
  createMessagesTableQuery,
  createStudentsTableQuery,
  createTable,
};
