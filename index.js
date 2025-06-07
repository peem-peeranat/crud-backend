require('dotenv').config();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');  // <-- เปลี่ยนตรงนี้
const cors = require('cors');

app.use(bodyParser.json());
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

const port = 8000;

let connection = null;

const initMySQL = async () => {
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT)
    });
    console.log('✅ MySQL connected successfully!');
  } catch (error) {
    console.error('❌ Failed to connect to MySQL:', error);
    throw error;
  }
};

// ดึงข้อมูลผู้ใช้ทั้งหมด
app.get('/users', async (req, res) => {
  try {
    const [results] = await connection.query('SELECT * FROM usersdata');
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// ดึงข้อมูลผู้ใช้ตาม ID
app.get('/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [results] = await connection.query('SELECT * FROM usersdata WHERE id = ?', [id]);

    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// เพิ่มผู้ใช้ใหม่
app.post('/users', async (req, res) => {
  try {
    const user = req.body;
    const [results] = await connection.query('INSERT INTO usersdata SET ?', user);
    res.json({
      message: 'User added successfully',
      user: {
        id: results.insertId,
        ...user
      }
    });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ message: 'Error adding user' });
  }
});

// อัพเดทผู้ใช้ตาม ID
app.put('/user/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updateUser = req.body;

    await connection.query('UPDATE usersdata SET ? WHERE id = ?', [updateUser, id]);

    res.json({
      message: 'User updated successfully',
      user: {
        id,
        ...updateUser
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// ลบผู้ใช้ตาม ID
app.delete('/user/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [results] = await connection.query('DELETE FROM usersdata WHERE id = ?', [id]);

    res.json({
      message: 'User deleted successfully',
      indexDelete: results
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});


app.listen(port, async () => {
  await initMySQL();
  console.log(`Server is running on port ${port}`);
});
