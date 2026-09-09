#!/usr/bin/env bash
# Levanta todo el entorno de desarrollo en un solo comando:
#   - php artisan serve       (servidor HTTP)
#   - php artisan queue:listen (procesa los eventos de broadcasting en cola)
#   - npm run dev             (Vite)
#   - php artisan reverb:start (servidor WebSocket para tiempo real)
#
# Uso: ./dev.sh   (o "bash dev.sh" en Windows/Git Bash)

set -e
cd "$(dirname "${BASH_SOURCE[0]}")"

composer run dev
