#!/bin/bash

echo "🚀 Configurando Content Manager..."

# Instalar dependencias si no están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Generar cliente de Prisma
echo "🔧 Generando cliente de Prisma..."
npm run db:generate

# Aplicar migraciones
echo "📊 Aplicando migraciones de base de datos..."
npm run db:push

# Sembrar datos de prueba
echo "🌱 Sembrando datos de prueba..."
npm run db:seed

echo "✅ ¡Configuración completa!"
echo ""
echo "📝 Credenciales de prueba:"
echo "   Admin: admin@example.com / admin123"
echo "   Viewer: viewer@example.com / viewer123"
echo ""
echo "🎯 Para iniciar el servidor:"
echo "   npm run dev"
echo ""
echo "🌐 Luego visita: http://localhost:3000"