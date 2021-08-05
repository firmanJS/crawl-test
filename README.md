## Instalasi

copy `.env-sample` melalui perintah berikut :

```bash
cp .env-sample .env
```
lalu isi bagian `ELEVENIA_KEY` dan `ELEVENIA_API` dengan key elevenia dan url api elevenia: 
```bash
NODE_ENV=development
APP_PORT=3000
APP_HOST=localhost
ELEVENIA_KEY=
ELEVENIA_API=http://xxxxxx/rest

PG_HOST=localhost
PG_PORT=5432
PG_USERNAME= # isi dengan username postgre
PG_PASSWORD= # isi dengan password postgre
PG_DATABASE= # isi dengan database postgre
```
### Dokumentasi

import `example.postman_collection.json` ke postman

### Menjalankan aplikasi

```bash
yarn dev

or

npm run dev
```