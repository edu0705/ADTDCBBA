// src/context/AuthContext.js
import React, { 
    createContext, 
    useState, 
    useEffect, 
    useContext, 
    useMemo, 
    useCallback // <-- 1. IMPORTA useCallback
} from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRoles, setUserRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Verifica el token al iniciar la aplicación para mantener la sesión
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const response = await authService.api.get('/users/user-info/');
                    setIsLoggedIn(true);
                    setUserRoles(response.data.groups);
                } catch (error) {
                    // Token inválido o expirado, forzar logout
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    // Función llamada desde Login.js al ingresar
    const login = (roles) => {
        setIsLoggedIn(true);
        setUserRoles(roles);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setIsLoggedIn(false);
        setUserRoles([]);
    };

    // --- INICIO DE LA MEJORA 1 ---
    // 2. Envuelve 'hasRole' en useCallback
    //    Esta función solo se recreará si 'userRoles' cambia.
    const hasRole = useCallback(
        (role) => userRoles.includes(role),
        [userRoles] 
    );
    // --- FIN DE LA MEJORA 1 ---


    // --- INICIO DE LA MEJORA 2 ---
    // 3. Envuelve el objeto 'value' en useMemo
    const value = useMemo(
        () => ({
            isLoggedIn,
            userRoles,
            loading,
            login,
            logout,
            hasRole
        }), 
        [isLoggedIn, userRoles, loading, hasRole] // 4. AÑADE 'hasRole' a las dependencias
    );
    // --- FIN DE LA MEJORA 2 ---


    return (
        // Pasa el objeto memorizado
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);