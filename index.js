require('dotenv').config();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql2');
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


//สำหรับดึงข้อมูลผู้ใช้
// ใช้ GET method เพื่อดึงข้อมูลผู้ใช้ทั้งหมด
app.get('/users', async (req, res) => {
  const results = await connection.query('SELECT * FROM usersdata');
  res.json(results[0]);
});


//สำหรับดึงข้อมูลผู้ใช้
// ใช้ GET method เพื่อดึงข้อมูลผู้รายละเอียดตาม ID
app.get('/users/:id', async (req, res) => {
  try {
    let id = req.params.id;
    const results = await connection.query('SELECT * FROM usersdata WHERE id = ?', id);

    if (results[0].length > 0) {
      return res.json(results[0][0]);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});


// สำหรับเพิ่มข้อมูลผู้ใช้
// ใช้ POST method เพื่อเพิ่มผู้ใช้ใหม่
app.post('/users', async (req, res) => {
  try {
    let user = req.body;
    const results = await connection.query('INSERT INTO usersdata SET ?', user);
    res.json({
      message: 'User added successfully',
      user: {
        id: results[0].insertId,
        ...user
      }
    })
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ message: 'Error adding user' });
  }
});

//สำหรับแก้ไขข้อมูลผู้ใช้
// ใช้ PUT method เพื่ออัพเดทข้อมูลผู้ใช้ตาม ID
app.put('/user/:id', async (req, res) => {
  try {
    let id = req.params.id;
    let updateUser = req.body;

    const results = await connection.query(
      'UPDATE usersdata SET ? WHERE id = ?',
      [updateUser, id]);


    res.json({
      message: 'User updated successfully',
      user: {
        id: id,
        ...updateUser
      }
    })
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ message: 'Error adding user' });
  }
});



app.delete('/user/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const results = await connection.query('DELETE from usersdata WHERE id = ?', id);
    res.json({
      message: 'User deleted successfully',
      indexDelete: results[0]
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});













app.listen(port, async (req, res) => {
  await initMySQL()
  console.log(`Server is running on port ${port}`)
});
