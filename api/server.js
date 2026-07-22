const app = require('./index');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API do Bravo's rodando em http://localhost:${PORT}`);
});
