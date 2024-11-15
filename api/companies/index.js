const axios = require('axios');

module.exports = async (req, res) => {
    // Récupérer le SIREN depuis l'URL
    const siren = req.query.siren;
    
    if (!siren) {
        return res.status(400).json({ error: 'SIREN requis' });
    }
    
    try {
        // Login INPI
        const loginResponse = await axios.post('https://registre-national-entreprises.inpi.fr/api/sso/login', {
            username: process.env.INPI_USERNAME,
            password: process.env.INPI_PASSWORD
        });

        const token = loginResponse.data.token;

        // Appel API INPI
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
};