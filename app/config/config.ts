// app/config/config.ts
// Configuración que funciona tanto en Deno como en Next.js

// Función para obtener variables de entorno de manera compatible
const getEnvVar = (key: string): string | undefined => {
  // En Deno (servidor backend)
  if (typeof Deno !== 'undefined') {
    return Deno.env.get(key);
  }
  
  // En Next.js (cliente/servidor frontend)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || process.env[`NEXT_PUBLIC_${key}`];
  }
  
  return undefined;
};

export const config = {
  // URLs de servicios - obtenidas de variables de entorno
  backend: {
    url: getEnvVar("BACKEND_URL") || "http://localhost:8000"
  },
  
  frontend: {
    url: getEnvVar("FRONTEND_URL") || "http://localhost:3000"
  },
  
  // Configuración de WhatsApp (solo para servidor Deno)
  whatsappApiUrl: "https://graph.facebook.com/v22.0/660499770460535", // Reemplazar con tu Phone Number ID
  whatsappToken: getEnvVar("WHATSAPP_API_TOKEN"),
  
  // Configuración de puertos
  ports: {
    backend: 8000,
    frontend: 3000
  }
};

// Función helper para obtener la URL del backend
export const getBackendUrl = () => {
  return config.backend.url;
};

// Función helper para construir URLs de API
export const buildApiUrl = (endpoint: string) => {
  const baseUrl = getBackendUrl();
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Exportar para usar en los componentes
export default config;