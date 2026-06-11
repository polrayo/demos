# ============================================================
# Demo Landing Page — Dockerfile multi-stage
# ============================================================
# Stages:
#   deps  → instalación de dependencias (base compartida)
#   dev   → servidor de desarrollo Vite (puerto 5173)
#   build → bundle de producción optimizado
#   prod  → servidor Nginx Alpine (puerto 8080)
# ============================================================

# ── Stage 1: deps ────────────────────────────────────────────
# Instalar solo las dependencias de npm para reutilizar la capa
FROM node:20-alpine AS deps

WORKDIR /app

# Copiar solo los manifests para aprovechar el cache de Docker
COPY package.json package-lock.json ./

# npm ci es más estricto y reproducible que npm install
RUN npm ci

# ── Stage 2: dev ─────────────────────────────────────────────
# Servidor de desarrollo con hot-module replacement
FROM deps AS dev

# Copiar el código fuente completo
COPY . .

EXPOSE 5173

# --host 0.0.0.0 hace que Vite escuche en todas las interfaces (necesario en Docker)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ── Stage 3: build ───────────────────────────────────────────
# Genera el bundle estático optimizado para producción
FROM deps AS build

COPY . .

RUN npm run build

# ── Stage 4: prod ────────────────────────────────────────────
# Imagen mínima: solo Nginx + los archivos estáticos compilados
FROM nginx:alpine AS prod

# Copiar el build de Vite al directorio raíz de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración personalizada de Nginx:
#   - Puerto 8080 (no root, compatible con PaaS y Kubernetes)
#   - Soporte SPA: redirige rutas desconocidas a index.html
#   - Cache agresivo para assets estáticos
#   - Compresión gzip habilitada
RUN printf '\
server {\n\
    listen 8080;\n\
    listen [::]:8080;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    # Soporte SPA — todas las rutas van a index.html\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    # Cache 1 año para assets con hash de contenido (JS, CSS, imágenes, fuentes)\n\
    location ~* \\.(?:js|css|woff2?|ttf|eot|png|jpg|jpeg|gif|ico|svg|webp)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
        access_log off;\n\
    }\n\
\n\
    # Compresión gzip para reducir tamaño de transferencia\n\
    gzip on;\n\
    gzip_vary on;\n\
    gzip_proxied any;\n\
    gzip_comp_level 6;\n\
    gzip_types\n\
        text/plain\n\
        text/css\n\
        text/xml\n\
        application/json\n\
        application/javascript\n\
        application/xml+rss\n\
        image/svg+xml;\n\
    gzip_min_length 1024;\n\
}\n\
' > /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
