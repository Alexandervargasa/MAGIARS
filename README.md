# MAGIARS Fullstack (Demo)

Incluye **frontend (React + Vite)** y **backend (Express)** para cubrir las HU solicitadas.

## 🚀 Cómo correr

### Backend
```bash
cd magiars-backend
npm install
npm start
```
Corre en `http://localhost:4000`.

### Frontend
```bash
cd magiars-frontend
npm install
npm run dev
```
Abre `http://localhost:5173`.

## ✅ Requisitos Cubiertos
- **HU-01 F**: Enviar un mensaje al chatbot en redes sociales (Con el ChatWidget, con el botón Enviar).
- **HU-02 F**: Recibir respuesta automática del chatbot (El bot te contesta con un mensaje por defecto).
- **HU-03 F**: Escalar mi caso a un humano (ChatWidget con botón Escalar).
- **HU-04 F**: Atender conversaciones escaladas (Inbox de casos).
- **HU-05 F**: Configurar integraciones con redes sociales (formulario Integrations).
- **HU-11 NF**: Ser notificado de fallos de conexión (banner + alertas).

## 🔗 Conexión
El frontend usa la URL del backend `http://localhost:4000` configurada en `src/services/api.js`.
