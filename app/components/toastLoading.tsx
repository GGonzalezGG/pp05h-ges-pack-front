import { toast, Id } from 'react-toastify';

let loadingToastId: Id | null = null;

export const showLoadingToast = (): void => {
  loadingToastId = toast.info('Cargando...', {
    autoClose: false,
    closeButton: false,
    hideProgressBar: true,
  });
};

export const hideLoadingToast = (): void => {
  if (loadingToastId) {
    toast.dismiss(loadingToastId);
    loadingToastId = null;
  }
};