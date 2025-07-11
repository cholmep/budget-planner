declare module 'react-toastify' {
  export const toast: {
    (message: string, options?: any): void;
    success(message: string, options?: any): void;
    error(message: string, options?: any): void;
    info(message: string, options?: any): void;
    warn(message: string, options?: any): void;
  };
  export const ToastContainer: React.ComponentType<any>;
} 