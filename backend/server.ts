import app from './app';

const PORT: number = parseInt(process.env.PORT || '4000', 10);

app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
  console.log(`Dokumentacja API dostępna pod adresem http://localhost:${PORT}/api-docs`);
});