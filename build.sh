#!/usr/bin/env bash
# exit on error
set -o errexit

# 1. Instalar Dependencias
pip install -r requirements.txt

# 2. Recolectar Archivos Estáticos (CSS, JS, Imágenes)
# Esto mueve los archivos a la carpeta 'staticfiles' para que la nube los sirva.
python manage.py collectstatic --no-input

# 3. EJECUTAR MIGRACIONES (AQUÍ ESTÁ LA CLAVE)
# Este comando crea las tablas en la base de datos de Render (PostgreSQL)
# basándose en tus archivos de 'migrations'.
python manage.py migrate