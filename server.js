const express = require('express');
const bodyParser = require('body-parser');
const markCallReadRouter = require('./routes/mark-call-read');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(markCallReadRouter);

app.get('/', (req, res) => {
  res.send('Shopify Metafield Updater is running');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
