const handler = (req, res) => {
    res.status(200).json({ message: 'API opérationnelle' });
};

module.exports = handler;