
# MAGIARS
Proyecto de todo el semestre de ingenieria de software

Por:
Jeronimo Rodriguez,
Simon Tovar y
Alexander Vargas


# MAGIARS Fullstack (v1.0.0) 

Incluye **frontend (React + Vite)**, **backend (Express)** y **Bot funcional en Instagram**

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
- **HU-03 F**: Escalar mi caso a un humano (ChatWidget con botón Escalar).
- **HU-04 F**: Atender conversaciones escaladas (Inbox de casos).
- **HU-05 F**: Configurar integraciones con redes sociales (formulario Integrations).
- **HU-06 F**: Entrenar nuevas respuestas y ajustar intenciones.
- **HU-08 F**: Consultar preguntas frecuentes
- **HU-11 NF**: Ser notificado de fallos de conexión (banner + alertas).
- **HU-10 F**: Revisar historial de conversación.
- **HU-12 F**: Definir horarios de disponibilidad del chatbot.
- **HU-13 F**: Usar el chatbot en varias redes (FB, IG, Twitter).
- **HU-15 F**: Valorar la atención recibida.
- **HU-16 F**: Etiquetar conversaciones por tema.
- **HU-17 NF**: Que el chatbot use un lenguaje natural cercano y amigable.
- **HU-20 NF**: Que el chatbot escale horizontalmente con la demanda.

## 🔗 Conexión
El frontend usa la URL del backend `http://localhost:4000` configurada en `src/services/api.js`.

## Base de datos
Se usa SQLite3, para instalar:

```bash
npm install sqlite3
npm install sqlite
```

## API de Google (Gemini)
Para utilizarla en el proyecto, basta con ejecutar el siguiente comando:

```bash
npm install @google/generative-ai
```
>>>>>>> v0.4.0


## Instagram
El bot ya se integro a Instagram, para conectar, simplemente conecte su aplicacion respectiva con los identificadores y tokens.