const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const PORT = 3000;

// MySQL connection settings 
const dbConfig = {
  host: 'sql.freedb.tech',
  user: 'freedb_Devsk',
  password: 'sjkjDqR$hU7kBzw',
  database: 'freedb_School',
  port:3306,    
};

// Create MySQL connection pool
const db = mysql.createPool(dbConfig);

// Middleware
app.use(express.json());

// home route 

app.get('/' , (req ,res) =>{
    res.send("oops! It's an Home Route ");
})
// Add School API
app.post('/addSchool', async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;

    // Validate input data
    if (!name || !address || !latitude || !longitude) {
      return res.status(400).send({ error: 'All fields are required' });
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).send({ error: 'Latitude and longitude must be numbers' });
    }

    // Insert new school into database
    const query = `INSERT INTO schools (name, address , latitude ,longitude ) VALUES ('${name}', '${address}' , '${latitude}' ,'${longitude}') `;
    const result = await db.execute(query);

    res.send({ message: 'School added successfully', id: result[0].insertId });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to add school' });
  }
});

// List Schools API
app.get('/listSchools', async (req, res) => {
  try {
    const { latitude: userLatitude, longitude: userLongitude } = req.query;

    // Validate input data
    if (!userLatitude || !userLongitude) {
      return res.status(400).send({ error: 'Latitude and longitude are required' });
    }

    // Fetch schools from database
    const query = 'SELECT * FROM schools';
    const [schools] = await db.execute(query);

    // Calculate distance between user's location and each school
    schools.forEach((school) => {
      const distance = calculateDistance(Number(userLatitude), Number(userLongitude), school.latitude, school.longitude);
      school.distance = distance;
    });

    // Sort schools by distance
    schools.sort((a, b) => a.distance - b.distance);

    res.send(schools);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to fetch schools' });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});