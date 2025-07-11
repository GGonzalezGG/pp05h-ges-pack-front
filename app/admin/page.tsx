// app/admin/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import RouteGuard from "../components/RouteGuard";
import RegistroPaqueteForm from "../components/RegistroPaqueteForm";
import { ToastContainer } from 'react-toastify';
import { showLoadingToast, hideLoadingToast } from '../components/toastLoading';
import RegistroUsuarioForm from "../components/RegistroUsuarioForm";
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from '../components/Dashboard';
import { paquetesConfig, reclamosConfig } from '../lib/dashboardConfigs';
import QRScannerPage from "../components/QRScannerPage";
import { buildApiUrl } from "../config/config";

interface Usuario {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  N_departamento: string;
  rut: string;
  correo: string;
  telefono: string;
  admin: boolean;
}

interface UserData {
  nombre: string;
  apellido: string;
  // Agrega otros campos que esperas en userData
}

export default function AdminPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState("usuarios");
  const router = useRouter();

  // Función para manejar el retiro de paquetes
  const handleRetirePackage = async (packageId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        alert('No hay token de autenticación');
        return;
      }

      const response = await fetch(buildApiUrl(`/api/paquetes/${packageId}/retirar`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Paquete retirado exitosamente');
      } else {
        alert(data.error || 'Error al retirar el paquete');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión al retirar el paquete');
    }
  };

  // Función para manejar reclamos
  const handleComplaintPackage = (packageId: number) => {
    // Redirigir a página de reclamos o abrir modal
    window.location.href = `/reclamos/nuevo?paquete=${packageId}`;
  };

 const handleStatusChange = async (itemId: number, newStatus: string) => {
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

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al actualizar estado');
      }

      // Mostrar notificación de éxito (opcional)
      console.log('Estado actualizado correctamente');
      
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      // Mostrar notificación de error al usuario
      alert('Error al actualizar el estado del reclamo');
      throw error; // Re-lanzar para que el componente maneje el error
    }
  };

  const fetchUsers = useCallback(async () => {
    showLoadingToast();
    
    try {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        console.error("No hay token disponible");
        router.push("/login");
        return;
      }
      
      console.log("Obteniendo usuarios...");
      const response = await fetch(buildApiUrl("/api/users"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Datos recibidos:", data);
      
      // Asegurarse de que data sea un array antes de asignarlo
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error("La respuesta no es un array:", data);
        setUsers([]); // Asignar array vacío si no es un array
      }
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      setUsers([]); // En caso de error, asignar array vacío
    } finally {
      setIsLoadingUsers(false);
      hideLoadingToast();
    }
  }, [router]);

  useEffect(() => {
    // Cargar datos del usuario desde localStorage
    const userDataStr = localStorage.getItem("userData");
    if (userDataStr) {
      try {
        const parsedUserData = JSON.parse(userDataStr);
        setUserData(parsedUserData);
      } catch (error) {
        console.error("Error al procesar datos de usuario:", error);
      }
    }
    
    // Cargar usuarios
    fetchUsers();
  }, [fetchUsers]);

  const handleLogout = () => {
    showLoadingToast();
    
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    
    setTimeout(() => {
      hideLoadingToast();
      router.push("/login");
    }, 500);
  };

  const loadUsuarios = () => {
    fetchUsers();
  };

  return (
    <RouteGuard adminOnly={true}>
      <div className="min-h-screen bg-slate-100 px-6 py-10">
        {/* Contenedor para las notificaciones toast */}
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={true} />
        
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-zinc-800 mb-1">Panel de Administrador</h1>
          <div>
            <p className="text-gray-500 text-sm">
              Bienvenido/a, <span className="font-semibold">{userData?.nombre} {userData?.apellido}</span>
            </p>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm px-5 py-1 rounded-md shadow-md transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Tabs de navegación */}
        <div className="border-b border-gray-200 mb-6">
          <ul className="flex flex-wrap -mb-px">
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("usuarios")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === "usuarios"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Usuarios
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("paquetes")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === "paquetes"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Paquetes
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("registrar")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === "registrar"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Registrar paquete
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("registrar-usuario")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === "registrar-usuario"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Registrar usuario
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("reclamos")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === "reclamos"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Reclamos
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("qr-scanner")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === "qr-scanner"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Escáner QR
              </button>
            </li>
          </ul>
        </div>

        {/* Contenido de la pestaña de usuarios */}
        {activeTab === "usuarios" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-zinc-800">Lista de usuarios</h2>
            <div className="mb-4">
              <button 
                onClick={loadUsuarios}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
              >
                Actualizar lista
              </button>
            </div>
            {isLoadingUsers ? (
              <div className="flex justify-center py-10">
                <p>Cargando usuarios...</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border text-zinc-950">
                {users.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-medium text-zinc-600 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-zinc-600 uppercase tracking-wider">
                          Nombre completo
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-zinc-600 uppercase tracking-wider">
                          Departamento
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-zinc-600 uppercase tracking-wider">
                          RUT
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-zinc-600 uppercase tracking-wider">
                          Contacto
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-zinc-600 uppercase tracking-wider">
                          Rol
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="whitespace-nowrap px-6 py-4">
                            {user.username}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {user.nombre} {user.apellido}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {user.N_departamento}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">{user.rut}</td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {user.correo}<br />
                            {user.telefono}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {user.admin ? "Administrador" : "Residente"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center">
                    <p>No hay usuarios para mostrar</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dashboard */}
        {activeTab === "paquetes" && (
          <div className="container mx-auto px-4 py-6">
            <Dashboard 
              config={paquetesConfig}
              viewMode="table" // o "cards"
              showPackageDetails={true} // Habilita vista de tarjetas
              onRetirePackage={handleRetirePackage} // Callback para retiros
              onComplaintPackage={handleComplaintPackage} // Callback para reclamos
              refreshInterval={30000}
            />
          </div>
        )}
        {/* Dashboard */}
        {activeTab === "reclamos" && (
          <div className="container mx-auto px-4 py-6">
            <Dashboard
              config={reclamosConfig}
              refreshInterval={30000}
              viewMode="table"
              onStatusChange={handleStatusChange}
            />
          </div>
        )}

        {/* Contenido de la pestaña de registro de paquetes */}
        {activeTab === "registrar" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-zinc-800">Registrar nuevo paquete</h2>
            <RegistroPaqueteForm/>
          </div>
        )}
        {/* Contenido de la pestaña de registro de usuarios */}
        {activeTab === "registrar-usuario" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-zinc-800">Registrar nuevo usuario</h2>
            <RegistroUsuarioForm onSuccess={loadUsuarios} />
          </div>
        )}
        {/* Contenido de la pestaña de escáner QR */}
        {activeTab === "qr-scanner" && (
          <div>
            <QRScannerPage />
          </div>
        )}

      </div>
    </RouteGuard>
  );
}