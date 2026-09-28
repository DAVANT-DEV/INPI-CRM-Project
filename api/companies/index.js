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
app.options('*', cors(corsOptions));

const INPI_URL = 'https://registre-national-entreprises.inpi.fr/api';

// Jeton INPI gardé en mémoire tant que la fonction reste chaude :
// on ne se reconnecte que s'il manque ou si l'INPI le refuse
let tokenPromise = null;

function getToken(forceLogin = false) {
    if (forceLogin || !tokenPromise) {
        tokenPromise = axios.post(`${INPI_URL}/sso/login`, {
            username: process.env.INPI_USERNAME,
            password: process.env.INPI_PASSWORD
        }, { timeout: 8000 })
            .then(r => r.data.token)
            .catch(err => { tokenPromise = null; throw err; });
    }
    return tokenPromise;
}

// Coupure réseau ou erreur 5xx de l'INPI : ça vaut la peine de réessayer
function isTransient(error) {
    const status = error.response?.status;
    return !status || status >= 500;
}

async function fetchCompany(siren) {
    let forceLogin = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const token = await getToken(forceLogin);
            const response = await axios.get(`${INPI_URL}/companies/${siren}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 20000
            });
            return response.data;
        } catch (error) {
            const status = error.response?.status;
            if (attempt === 2) throw error;
            if (status === 401 || status === 403) {
                forceLogin = true; // jeton expiré : nouvelle connexion
            } else if (!isTransient(error)) {
                throw error;
            }
            console.warn(`Nouvel essai INPI pour ${siren} :`, status || error.code || error.message);
        }
    }
}

// Endpoint principal pour récupérer les données d'une entreprise via son SIREN
app.get('/api/companies', async (req, res) => {
    const siren = req.query.siren;

    if (!siren) {
        return res.status(400).json({ error: 'SIREN requis' });
    }
    if (!/^\d{9}$/.test(siren)) {
        return res.status(400).json({ error: 'SIREN invalide (9 chiffres attendus)' });
    }

    try {
        res.json(await fetchCompany(siren));
    } catch (error) {
        console.error('Erreur:', error.response?.data || error.message);
        const status = error.response?.status === 404 ? 404 : 502;
        res.status(status).json({
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
