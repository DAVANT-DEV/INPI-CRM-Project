const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Route de test simple
app.get('/test', (req, res) => {
    res.json({ message: 'API opérationnelle' });
});

// Route principale INPI
app.get('/api/companies/:siren', async (req, res) => {
    try {
        // Login INPI
        const loginResponse = await axios.post('https://registre-national-entreprises.inpi.fr/api/sso/login', {
            username: process.env.INPI_USERNAME,
            password: process.env.INPI_PASSWORD
        });

        const token = loginResponse.data.token;

        // Appel API INPI
        const apiResponse = await axios.get(
            `https://registre-national-entreprises.inpi.fr/api/companies/${req.params.siren}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        res.json(apiResponse.data);
    } catch (error) {
        console.error('Erreur:', error.response?.data || error.message);
        res.status(500).json({
            error: error.message,
            details: error.response?.data
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});