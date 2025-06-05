const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const markCallReadRouter = require('./routes/mark-call-read');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use('/api/mark-call-read', markCallReadRouter);

app.get('/', (req, res) => {
  res.send('Shopify Metafield Updater is running');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
