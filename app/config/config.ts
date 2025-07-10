// config/config.ts
// config especifica frontend

export const config = {
  // URLs de servicios - usar directamente las variables de entorno
  backend: {
    url: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
  },
  
  frontend: {
    url: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"
  },
  
  // Configuración de puertos por defecto
  ports: {
    backend: 8000,
    frontend: 3000
  },
  
  // Configuración adicional si la necesitas
  api: {
    timeout: 30000, // 30 segundos
    retries: 3
  }
};

// Función helper para obtener la URL del backend
export const getBackendUrl = (): string => {
  const backendUrl = config.backend.url;
  
  // Log para debugging (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Variables de entorno disponibles:');
    console.log('🔍 NEXT_PUBLIC_BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
    console.log('🔍 Backend URL final:', backendUrl);
    console.log('🔍 Tipo de entorno:', typeof window === 'undefined' ? 'servidor' : 'cliente');
  }
  
  return backendUrl;
};

// Función helper para obtener la URL del frontend
export const getFrontendUrl = (): string => {
  return config.frontend.url;
};

// Función helper para construir URLs de API
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getBackendUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}${cleanEndpoint}`;
  
  // Log para debugging (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔗 Building API URL:');
    console.log('   Base URL:', baseUrl);
    console.log('   Endpoint:', cleanEndpoint);
    console.log('   Full URL:', fullUrl);
  }
  
  return fullUrl;
}

// Exportar configuración por defecto
export default config;