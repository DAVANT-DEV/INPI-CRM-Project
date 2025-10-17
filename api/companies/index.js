const axios = require('axios');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration CORS pour autoriser les requêtes depuis make.powerapps.com
const corsOptions = {
            // Ajout de votre environnement PowerApps et Dynamics
    origin: [
        'https://make.powerapps.com',
        'https://davant-preprod.crm12.dynamics.com', // Ajout de l'environnement de Preproduction
        'https://davant.crm12.dynamics.com',// Ajout de l'environnement de production
        'https://www.augusto-pizza.fr',// Ajout de l'environnement web     
        'https://augusto-pizza.fr'                 

    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [
        'Authorization',
        'Content-Type',
        'mscrm.mergelabels',
        'mscrm.solutionuniquename',
        'prefer',
        'x-ms-client-request-id',
        'x-ms-client-session-id'
    ]
};

// Utiliser CORS avec les options définies
app.use(cors(corsOptions));

// Endpoint principal pour récupérer les données d'une entreprise via son SIREN
app.get('/api/companies', async (req, res) => {
    const siren = req.query.siren;

    if (!siren) {
        return res.status(400).json({ error: 'SIREN requis' });
    }

    try {
        // Connexion à l'API INPI pour obtenir un token
        const loginResponse = await axios.post('https://registre-national-entreprises.inpi.fr/api/sso/login', {
            username: process.env.INPI_USERNAME,
            password: process.env.INPI_PASSWORD
        });

        const token = loginResponse.data.token;

        // Requête API INPI avec le token
        const apiResponse = await axios.get(
            `https://registre-national-entreprises.inpi.fr/api/companies/${siren}`,
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

// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
//Ajout des domaines augusto-pizza.fr au CORS
