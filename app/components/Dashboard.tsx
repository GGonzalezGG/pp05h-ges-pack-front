import React, { useState, useEffect, useCallback } from 'react';
import { Package, Clock, AlertTriangle, CheckCircle, XCircle, Grid, List } from 'lucide-react';
import PackageDisplay, { PackageData } from './PackageDisplay';
import StatusSelector from './StatusSelector';
import { buildApiUrl } from '../config/config';

// Tipos para los datos del dashboard
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

// Tipo para la respuesta de la API
interface ApiResponse {
  success: boolean;
  data?: DashboardItem[];
  error?: string;
}

// Tipo para los datos sin procesar de la API
interface RawApiItem {
  id: number;
  idDestinatario?: number;
  iddestinatario?: number;
  idRetirador?: number;
  idretirador?: number;
  fechaEntrega?: string;
  fechaentrega?: string;
  fechaLimite?: string;
  fechalimite?: string;
  fechaRetiro?: string;
  fecharetiro?: string;
  ubicacion?: string;
  nombreDestinatario?: string;
  nombredestinatario?: string;
  apellidoDestinatario?: string;
  apellidodestinatario?: string;
  departamento?: string;
  nombreRetirador?: string;
  nombreretirador?: string;
  apellidoRetirador?: string;
  apellidoretirador?: string;
  idUsuario?: number;
  idusuario?: number;
  idPack?: number;
  idpack?: number;
  nombreResidente?: string;
  nombreresidente?: string;
  apellidoResidente?: string;
  apellidoresidente?: string;
  estado?: string;
  descripcion?: string;
  fechaCreacion?: string;
  fechacreacion?: string;
  ubicacionPaquete?: string;
  ubicacionpaquete?: string;
  fechaEntregaPaquete?: string;
  fechaentregapaquete?: string;
}

interface DashboardConfig {
  title: string;
  endpoint: string;
  itemType: 'paquete' | 'reclamo';
  columns: {
    key: string;
    label: string;
    render?: (item: DashboardItem) => React.ReactNode;
  }[];
  statusConfig: {
    getStatus: (item: DashboardItem) => 'pending' | 'delivered' | 'expired' | 'processing';
    getStatusColor: (status: string) => string;
    getStatusIcon: (status: string) => React.ReactNode;
  };
}

interface DashboardProps {
  config: DashboardConfig;
  refreshInterval?: number;
  viewMode?: 'table' | 'cards';
  showPackageDetails?: boolean;
  onRetirePackage?: (packageId: number) => void;
  onComplaintPackage?: (packageId: number) => void;
  onStatusChange?: (itemId: number, newStatus: string) => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  config, 
  refreshInterval = 30000, // 30 segundos por defecto
  viewMode = 'table',
  showPackageDetails = false,
  onRetirePackage,
  onComplaintPackage,
  onStatusChange
}) => {
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentViewMode, setCurrentViewMode] = useState<'table' | 'cards'>(viewMode);

  // Función para obtener datos del servidor - ahora con useCallback para evitar el warning
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(buildApiUrl(`${config.endpoint}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      
      if (data.success) {
        // Procesar los datos para normalizar las propiedades
        const processedData = (data.data || []).map((item: RawApiItem) => {
          // Normalizar propiedades que pueden venir en diferentes casos
          const normalizedItem: DashboardItem = {
            id: item.id,
            // Para paquetes
            idDestinatario: item.idDestinatario || item.iddestinatario,
            idRetirador: item.idRetirador || item.idretirador,
            fechaEntrega: item.fechaEntrega || item.fechaentrega,
            fechaLimite: item.fechaLimite || item.fechalimite,
            fechaRetiro: item.fechaRetiro || item.fecharetiro,
            ubicacion: item.ubicacion,
            nombreDestinatario: item.nombreDestinatario || item.nombredestinatario,
            apellidoDestinatario: item.apellidoDestinatario || item.apellidodestinatario,
            departamento: item.departamento,
            nombreRetirador: item.nombreRetirador || item.nombreretirador,
            apellidoRetirador: item.apellidoRetirador || item.apellidoretirador,
            // Para reclamos
            idUsuario: item.idUsuario || item.idusuario,
            idPack: item.idPack || item.idpack,
            nombreResidente: item.nombreResidente || item.nombreresidente,
            apellidoResidente: item.apellidoResidente || item.apellidoresidente,
            estado: item.estado,
            descripcion: item.descripcion,
            fechaCreacion: item.fechaCreacion || item.fechacreacion,
            ubicacionPaquete: item.ubicacionPaquete || item.ubicacionpaquete,
            fechaEntregaPaquete: item.fechaEntregaPaquete || item.fechaentregapaquete,
          };
          
          return normalizedItem;
        });
        
        setItems(processedData);
        setLastUpdate(new Date());
        setError(null);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error al obtener datos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [config.endpoint]); // Dependencia añadida para useCallback

  // Efecto para cargar datos inicial y configurar refresh automático
  useEffect(() => {
    fetchData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]); // fetchData añadido como dependencia

  // Función para formatear fecha
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  // Función para convertir DashboardItem a PackageData
  const convertToPackageData = (item: DashboardItem): PackageData => {
    return {
      paquete: {
        ID_pack: item.id,
        ID_userDestinatario: item.idDestinatario || 0,
        ID_userRetirador: item.idRetirador,
        fecha_entrega: item.fechaEntrega || '',
        fecha_limite: item.fechaLimite,
        fecha_retiro: item.fechaRetiro,
        ubicacion: item.ubicacion || ''
      },
      destinatario: {
        ID_usuario: item.idDestinatario || 0,
        nombre: item.nombreDestinatario || '',
        apellido: item.apellidoDestinatario || '',
        N_departamento: item.departamento || '',
        retiro_compartido: false
      },
      retirador: item.idRetirador ? {
        ID_usuario: item.idRetirador,
        nombre: item.nombreRetirador || '',
        apellido: item.apellidoRetirador || '',
        N_departamento: '',
        retiro_compartido: false
      } : undefined,
      notificacion: {
        ID_notificacion: 0,
        ID_pack: item.id,
        mensaje: item.descripcion || `Paquete entregado en ${item.ubicacion}`,
        fecha_envio: item.fechaEntrega || '',
        leido: false
      }
    };
  };

  // Función para manejar el retiro de paquetes
  const handleRetirePackage = (packageId: number) => {
    if (onRetirePackage) {
      onRetirePackage(packageId);
    }
  };

  // Agregar función para cambiar estado de reclamos
  const handleStatusChange = async (itemId: number, newStatus: string) => {
    if (onStatusChange) {
      await onStatusChange(itemId, newStatus);
      // Refrescar datos después del cambio
      await fetchData();
    } else {
      // Implementación por defecto si no se pasa la función
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          throw new Error('No hay token de autenticación');
        }

        const response = await fetch(buildApiUrl(`/api/reclamos/${itemId}`), {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data: ApiResponse = await response.json();
        
        if (data.success) {
          // Refrescar datos después del cambio exitoso
          await fetchData();
        } else {
          throw new Error(data.error || 'Error al actualizar estado');
        }
      } catch (error) {
        console.error('Error al cambiar estado:', error);
        // Aquí podrías mostrar una notificación de error al usuario
      }
    }
  };

  // Función para manejar reclamos
  const handleComplaintPackage = (packageId: number) => {
    if (onComplaintPackage) {
      onComplaintPackage(packageId);
    }
  };

  // Calcular estadísticas
  const stats = React.useMemo(() => {
    const total = items.length;
    const statusCounts = items.reduce((acc, item) => {
      const status = config.statusConfig.getStatus(item);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      pending: statusCounts.pending || 0,
      delivered: statusCounts.delivered || 0,
      expired: statusCounts.expired || 0,
      processing: statusCounts.processing || 0
    };
  }, [items, config.statusConfig]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">Error: {error}</span>
        </div>
        <button 
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Diseño responsive mejorado */}
      <div className="space-y-4">
        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-800">{config.title}</h1>
        
        {/* Controles - Reorganización responsive */}
        <div className="flex flex-col space-y-3 sm:space-y-0">
          {/* Primera fila: Toggle de vista (solo si es necesario) */}
          {config.itemType === 'paquete' && showPackageDetails && (
            <div className="flex justify-center sm:justify-start">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrentViewMode('table')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    currentViewMode === 'table'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4 inline mr-1" />
                  Tabla
                </button>
                <button
                  onClick={() => setCurrentViewMode('cards')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    currentViewMode === 'cards'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="w-4 h-4 inline mr-1" />
                  Tarjetas
                </button>
              </div>
            </div>
          )}
          
          {/* Segunda fila: Info y botón de actualizar */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            {/* Última actualización */}
            {lastUpdate && (
              <span className="text-sm text-gray-500 text-center sm:text-left">
                Última actualización: {formatDate(lastUpdate.toISOString())}
              </span>
            )}
            
            {/* Botón actualizar */}
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas - VERSIÓN ACTUALIZADA PARA RECLAMOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">
                {config.itemType === 'reclamo' ? 'Pendientes' : 'Pendientes'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        {config.itemType === 'reclamo' ? (
          // Estadísticas específicas para reclamos
          <>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">En Revisión</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.processing}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Completados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Estadísticas para paquetes (mantener original)
          <>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Completados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Vencidos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Contenido principal */}
      {config.itemType === 'paquete' && showPackageDetails && currentViewMode === 'cards' ? (
        // Vista de tarjetas para paquetes
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay {config.itemType}s
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron {config.itemType}s para mostrar.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const packageData = convertToPackageData(item);
              const isPickedUp = !!item.fechaRetiro;
              
              return (
                <PackageDisplay
                  key={item.id}
                  packageData={packageData}
                  isPickedUp={isPickedUp}
                  onRetireClick={handleRetirePackage}
                  onComplaintClick={handleComplaintPackage}
                />
              );
            })
          )}
        </div>
      ) : (
        // Vista de tabla tradicional
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  {config.columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => {
                  const status = config.statusConfig.getStatus(item);
                  const statusColor = config.statusConfig.getStatusColor(status);
                  const statusIcon = config.statusConfig.getStatusIcon(status);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {statusIcon}
                          <span className={`ml-2 text-sm font-medium ${statusColor}`}>
                            {status}
                          </span>
                        </div>
                      </td>
                      {config.columns.map((column) => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {column.key === 'acciones' && config.itemType === 'reclamo' ? (
                            <StatusSelector
                              currentStatus={item.estado || 'pendiente'}
                              itemId={item.id}
                              onStatusChange={handleStatusChange}
                            />
                          ) : column.render 
                            ? column.render(item)
                            : item[column.key as keyof DashboardItem] || 'N/A'
                          }
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {items.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay {config.itemType}s
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron {config.itemType}s para mostrar.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;