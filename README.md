# Cafeteria

Sistema de cafeteria construido con Laravel, Inertia, React, Tailwind CSS, MySQL y Reverb para trabajo en tiempo real.

## Requisitos

- PHP 8.3 o superior
- Composer
- Node.js 22 o superior
- MySQL 8 o MariaDB compatible
- Laragon, Herd, Valet o `php artisan serve` para servir la aplicacion

## Instalacion Desde Cero

1. Clonar el repositorio.

```bash
git clone <url-del-repositorio> cafeteria
cd cafeteria
```

2. Instalar dependencias PHP y JavaScript.

```bash
composer install
npm install
```

En Windows, si `npm` falla por politica de PowerShell, usa:

```powershell
npm.cmd install
```

3. Crear el archivo de entorno.

```bash
cp .env.example .env
php artisan key:generate
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
php artisan key:generate
```

4. Crear la base de datos MySQL.

```sql
CREATE DATABASE cafeteria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. Revisar `.env`.

Valores esperados para desarrollo local:

```env
APP_URL=http://cafeteria.test
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cafeteria
DB_USERNAME=root
DB_PASSWORD=
BROADCAST_CONNECTION=reverb
```

6. Ejecutar migraciones y seeders.

```bash
php artisan migrate --seed
```

El seeder principal llama archivos separados por dominio:

- `RolesAndPermissionsSeeder`
- `DemoUsersSeeder`
- `PlatosSeeder`
- `MesasSeeder`
- `CoversSeeder`

## Usuarios Demo

Todos usan la contrasena `password`.

| Rol | Correo | PIN |
| --- | --- | --- |
| Gerente | `admin@cafeteria.test` | `0000` |
| Mesero | `mesero@cafeteria.test` | `1234` |
| Cajero | `cajero@cafeteria.test` | `5678` |
| Cocinero | `cocinero@cafeteria.test` | `9012` |

## Arranque En Desarrollo

Opcion recomendada para levantar todo junto:

```bash
composer run dev
```

Ese comando inicia:

- servidor Laravel
- cola de trabajos
- Vite
- Reverb para broadcasting

En Windows tambien puedes usar:

```powershell
composer run dev
```

Si trabajas con Laragon o Herd y ya tienes el sitio disponible en `http://cafeteria.test`, puedes levantar los procesos por separado:

```bash
npm run dev
php artisan queue:listen --tries=1
php artisan reverb:start --debug
```

## Build De Produccion

```bash
npm run build
php artisan optimize
```

## Pruebas Y Formato

```bash
php artisan test --compact
vendor/bin/pint --dirty --format agent
```

En Windows:

```powershell
php artisan test --compact
vendor\bin\pint --dirty --format agent
```

## Estructura De Datos Demo

Los datos iniciales estan separados para mantener el proyecto facil de escalar:

- `database/seeders/DemoUsersSeeder.php`: usuarios y acceso por PIN.
- `database/seeders/PlatosSeeder.php`: productos iniciales.
- `database/seeders/MesasSeeder.php`: mesas de prueba.
- `database/seeders/CoversSeeder.php`: promociones/covers.

Para volver a cargar los datos demo:

```bash
php artisan db:seed --class=DatabaseSeeder
```

Para reiniciar la base desde cero:

```bash
php artisan migrate:fresh --seed
```

## Broadcasting

El proyecto usa Laravel Reverb. Las variables necesarias ya estan en `.env.example`:

```env
REVERB_APP_ID=local-app
REVERB_APP_KEY=local-key
REVERB_APP_SECRET=local-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
```

Si cambias esos valores, actualiza tambien las variables `VITE_REVERB_*` del mismo archivo.
