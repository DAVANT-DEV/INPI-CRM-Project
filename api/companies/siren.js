const axios = require('axios');

module.exports = async (req, res) => {
    const { siren } = req.query;
    
    try {
        const loginResponse = await axios.post('https://registre-national-entreprises.inpi.fr/api/sso/login', {
            username: process.env.INPI_USERNAME,
            password: process.env.INPI_PASSWORD
        });

        const token = loginResponse.data.token;
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
        res.status(500).json({ error: error.message });
    }
};