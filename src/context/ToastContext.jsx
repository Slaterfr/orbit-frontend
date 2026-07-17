import { createContext, useContext, useState } from 'react';
import { Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <div className="toast-overlay">
                    <Info size={16} color="var(--accent-secondary)" />
                    <span>{toast}</span>
                </div>
            )}
        </ToastContext.Provider>
    );
};
