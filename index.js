const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();

app.use(express.json());
app.use(cors());

// Configuration de la connexion à PostgreSQL locale
/*const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  port: 19467,
  password: 'database2025@',
  database: 'vopapier',
});*/
const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || '6.tcp.eu.ngrok.io',
  port: parseInt(process.env.PG_PORT) || 19467,
  password: process.env.PG_PASSWORD || 'database2025@', 
  database: process.env.PG_DATABASE || 'vopapier',
  ssl: { rejectUnauthorized: false }, // Nécessaire pour ngrok
});

// Middleware pour valider l'ID
const validateId = (req, res, next) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID invalide' });
  }
  req.id = id;
  next();
};

// Créer un permis (POST /api/permis)
app.post('/api/permis', async (req, res) => {
  const {
    nom,
    prenom,
    datenaissance,
    lieunaissance,
    numeropermis,
    residence,
    mention,
    restriction,
    dateobtention,
    dateexpiration,
    categorie,
    statut,
    image,
  } = req.body;

  if (!nom || !prenom || !datenaissance || !numeropermis || !dateobtention || !dateexpiration || !categorie) {
    return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
  }

  try {
    const query = `
      INSERT INTO permis (nom, prenom, datenaissance, lieunaissance, numeropermis, residence, mention, restriction, dateobtention, dateexpiration, categorie, statut, image)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    const values = [
      nom,
      prenom,
      datenaissance,
      lieunaissance,
      numeropermis,
      residence,
      mention || null,
      restriction || null,
      dateobtention,
      dateexpiration,
      categorie,
      statut || 'actif',
      image || null,
    ];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de l\'insertion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Lire tous les permis (GET /api/permis)
app.get('/api/permis', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM permis');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Lire un permis par ID (GET /api/permis/:id)
app.get('/api/permis/:id', validateId, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM permis WHERE id = $1', [req.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permis non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un permis (PUT /api/permis/:id)
app.put('/api/permis/:id', validateId, async (req, res) => {
  const {
    nom,
    prenom,
    datenaissance,
    lieunaissance,
    numeropermis,
    residence,
    mention,
    restriction,
    dateobtention,
    dateexpiration,
    categorie,
    statut,
    image,
  } = req.body;

  try {
    const result = await pool.query('SELECT * FROM permis WHERE id = $1', [req.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permis non trouvé' });
    }

    const updateQuery = `
      UPDATE permis
      SET nom = COALESCE($2, nom),
          prenom = COALESCE($3, prenom),
          datenaissance = COALESCE($4, datenaissance),
          lieunaissance = COALESCE($5, lieunaissance),
          numeropermis = COALESCE($6, numeropermis),
          residence = COALESCE($7, residence),
          mention = COALESCE($8, mention),
          restriction = COALESCE($9, restriction),
          dateobtention = COALESCE($10, dateobtention),
          dateexpiration = COALESCE($11, dateexpiration),
          categorie = COALESCE($12, categorie),
          statut = COALESCE($13, statut),
          image = COALESCE($14, image)
      WHERE id = $1
      RETURNING *;
    `;
    const values = [
      req.id,
      nom,
      prenom,
      datenaissance,
      lieunaissance,
      numeropermis,
      residence,
      mention,
      restriction,
      dateobtention,
      dateexpiration,
      categorie,
      statut,
      image,
    ];
    const updateResult = await pool.query(updateQuery, values);
    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un permis (DELETE /api/permis/:id)
app.delete('/api/permis/:id', validateId, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM permis WHERE id = $1 RETURNING *', [req.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permis non trouvé' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});