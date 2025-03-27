import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchClientById } from '../api/clientApi';
import { Client } from '../types/models';

interface UseClientResult {
  client: Client | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

const useClient = (
  id: string | undefined,
  user: any,
  checkAccessToClient: (clientData: Client, currentUser: any) => boolean
): UseClientResult => {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [retryCount, setRetryCount] = useState<number>(0);
  
  const loadClient = useCallback(async () => {
    if (!id) {
      setError('Nie znaleziono identyfikatora klienta');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      // Pobierz organizationId z pierwszej organizacji użytkownika (jeśli istnieje)
      const organizationId = user?.organizations && user.organizations.length > 0
        ? user.organizations[0].id
        : undefined;
      
      const data = await fetchClientById(Number(id), organizationId);
      // Jeżeli dostęp nie jest przyznany – natychmiast przekierowujemy
      const hasAccess = checkAccessToClient(data, user);
      if (!hasAccess) {
        console.log('Access denied to client data');
        navigate('/clients');
        return;
      }
      setClient(data);
      console.log("Client loaded:", data);
    } catch (err: any) {
      console.error('Error fetching client details:', err);
      if (err.response) {
        if (err.response.status === 403) {
          navigate('/clients');
          return;
        } else if (err.response.status === 404) {
          navigate('/clients');
          return;
        } else if (err.response.status === 500) {
          setError('Wystąpił błąd serwera. Spróbuj odświeżyć stronę lub skontaktuj się z administratorem.');
        } else {
          setError(`Wystąpił błąd: ${err.response.data?.message || 'Nieznany błąd'}`);
        }
      } else if (err.request) {
        setError('Nie można połączyć się z serwerem. Sprawdź swoje połączenie internetowe.');
      } else {
        setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, user, checkAccessToClient, navigate]);

  useEffect(() => {
    loadClient();
  }, [loadClient, retryCount]);

  return {
    client,
    isLoading,
    error,
    reload: () => setRetryCount(prev => prev + 1),
  };
};

export default useClient;