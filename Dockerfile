FROM ubuntu:24.04

# Evitar diálogos interactivos durante la instalación de paquetes
ARG DEBIAN_FRONTEND=noninteractive

# Actualizar repositorios e instalar herramientas básicas
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    vim \
    nano \
    build-essential \
    sqlite3 \
    python3 \
    sudo \
    tzdata \
    locales \
    && rm -rf /var/lib/apt/lists/*

# Configurar locale
RUN locale-gen es_UY.UTF-8
ENV LANG es_UY.UTF-8
ENV LANGUAGE es_UY:es
ENV LC_ALL es_UY.UTF-8

# Instalar Node.js 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# Crear directorio de la aplicación
WORKDIR /app

# Copiar archivos de package.json para instalar dependencias
COPY package.json ./
COPY web/package.json ./web/

# Instalar dependencias 
RUN npm install && \
    cd web && npm install

# Instalar bcrypt explícitamente (importante para el script de contraseñas)
RUN cd web && npm install bcrypt

# Exponer el puerto usado por la aplicación
EXPOSE 3000

# Configurar punto de entrada
ENTRYPOINT ["/bin/bash", "-c"]
CMD ["cd /app && chmod +x ./post-git-pull.sh && ./post-git-pull.sh && cd web && npm start"]
