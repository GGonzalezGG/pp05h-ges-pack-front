// app/lib/dashboardConfigs.tsx
import React from 'react';
import { Clock, CheckCircle, AlertTriangle, Package, FileText } from 'lucide-react';

// Importar el tipo DashboardItem del componente Dashboard
// Para evitar duplicación, usamos el mismo tipo que ya está definido
interface DashboardItem {
  id: number;
  idDestinatario?: number;
  idRetirador?: number;
  fechaEntrega?: string;
  fechaLimite?: string;
  fechaRetiro?: string;
  ubicacion?: string;
  nombreDestinatario?: string;
  apellidoDestinatario?: string;
  departamento?: string;
  nombreRetirador?: string;
  apellidoRetirador?: string;
  // Para reclamos
  idUsuario?: number;
  idPack?: number;
  nombreResidente?: string;
  apellidoResidente?: string;
  tipo?: string;
  estado?: string;
  descripcion?: string;
  fechaCreacion?: string;
  ubicacionPaquete?: string;
  fechaEntregaPaquete?: string;
}

// Función para formatear fecha
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

// Función para verificar si un paquete está vencido
const isExpired = (fechaLimite: string | null | undefined): boolean => {
  if (!fechaLimite) return false;
  return new Date(fechaLimite) < new Date();
};

// Configuración para Dashboard de Paquetes
export const paquetesConfig = {
  title: 'Dashboard de Paquetes',
  endpoint: '/api/paquetes',
  itemType: 'paquete' as const,
  columns: [
    {
      key: 'id',
      label: 'ID',
      render: (item: DashboardItem) => `#${item.id}`
    },
    {
      key: 'destinatario',
      label: 'Destinatario',
      render: (item: DashboardItem) => (
        <div>
          <div className="font-medium">
            {item.nombreDestinatario || 'N/A'} {item.apellidoDestinatario || ''}
          </div>
          <div className="text-gray-500">Depto. {item.departamento || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'ubicacion',
      label: 'Ubicación',
      render: (item: DashboardItem) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          {item.ubicacion || 'N/A'}
        </span>
      )
    },
    {
      key: 'fechaEntrega',
      label: 'Fecha Entrega',
      render: (item: DashboardItem) => formatDate(item.fechaEntrega)
    },
    {
      key: 'fechaLimite',
      label: 'Fecha Límite',
      render: (item: DashboardItem) => (
        <span className={`${isExpired(item.fechaLimite) ? 'text-red-600 font-medium' : ''}`}>
          {formatDate(item.fechaLimite)}
        </span>
      )
    },
    {
      key: 'retirador',
      label: 'Retirador',
      render: (item: DashboardItem) => 
        item.nombreRetirador 
          ? `${item.nombreRetirador} ${item.apellidoRetirador || ''}`
          : 'No retirado'
    }
  ],
  statusConfig: {
    getStatus: (item: DashboardItem) => {
      if (item.fechaRetiro) return 'delivered';
      if (isExpired(item.fechaLimite)) return 'expired';
      return 'pending';
    },
    getStatusColor: (status: string) => {
      switch (status) {
        case 'delivered': return 'text-green-600';
        case 'expired': return 'text-red-600';
        case 'pending': return 'text-yellow-600';
        default: return 'text-gray-600';
      }
    },
    getStatusIcon: (status: string) => {
      switch (status) {
        case 'delivered': 
          return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'expired': 
          return <AlertTriangle className="h-4 w-4 text-red-600" />;
        case 'pending': 
          return <Clock className="h-4 w-4 text-yellow-600" />;
        default: 
          return <Package className="h-4 w-4 text-gray-600" />;
      }
    }
  }
};

// Configuración para Dashboard de Reclamos
export const reclamosConfig = {
  title: 'Dashboard de Reclamos',
  endpoint: '/api/reclamos',
  itemType: 'reclamo' as const,
  columns: [
    {
      key: 'id',
      label: 'ID',
      render: (item: DashboardItem) => `#${item.id}`
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      render: (item: DashboardItem) => (
        <div className="max-w-xs truncate" title={item.descripcion || 'Sin descripción'}>
          {item.descripcion || 'Sin descripción'}
        </div>
      )
    },
    {
      key: 'residente',
      label: 'Residente',
      render: (item: DashboardItem) => (
        <div>
          <div className="font-medium">
            {item.nombreResidente || 'N/A'} {item.apellidoResidente || ''}
          </div>
          <div className="text-gray-500">Depto. {item.departamento || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'paquete',
      label: 'Paquete',
      render: (item: DashboardItem) => 
        item.idPack ? `Paquete #${item.idPack}` : 'Sin paquete asociado'
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: () => 'acciones' // Se manejará en el componente
    }
  ],
  statusConfig: {
    getStatus: (item: DashboardItem) => {
      switch (item.estado?.toLowerCase()) {
        case 'completado': 
          return 'delivered';
        case 'en_revision': 
          return 'processing';
        case 'pendiente': 
        default: 
          return 'pending';
      }
    },
    getStatusColor: (status: string) => {
      switch (status) {
        case 'delivered': return 'text-green-600';
        case 'processing': return 'text-blue-600';
        case 'pending': return 'text-yellow-600';
        default: return 'text-gray-600';
      }
    },
    getStatusIcon: (status: string) => {
      switch (status) {
        case 'delivered': 
          return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'processing': 
          return <Clock className="h-4 w-4 text-blue-600" />;
        case 'pending': 
          return <FileText className="h-4 w-4 text-yellow-600" />;
        default: 
          return <FileText className="h-4 w-4 text-gray-600" />;
      }
    }
  }
};