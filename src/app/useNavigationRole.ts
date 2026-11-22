import { useEffect, useState } from 'react';
import { getHubAuthSession } from '../services/session';
import { getHubRoleForCurrentSession } from '../services/role-access';

export type NavigationRole = 'dm' | 'player' | null;

/**
 * A navegação usa a mesma verificação de Auth + perfil + vínculo do guard.
 * Sem papel confirmado, nunca mostra links exclusivos de Mestre/Jogador.
 * Um menu oculto NAO substitui as Firestore Security Rules.
 */
export function useNavigationRole(): NavigationRole {
  const [role, setRole] = useState<NavigationRole>(null);

  useEffect(() => {
    let active = true;
    let revision = 0;
    let stop: () => void = () => undefined;
    try {
      stop = getHubAuthSession().observe(
        (identity) => {
          const current = ++revision;
          setRole(null);
          if (!identity) return;

          void getHubRoleForCurrentSession(identity.uid)
            .then((access) => {
              if (!active || revision !== current) return;
              setRole(access.status === 'verified' ? access.role : null);
            })
            .catch(() => {
              if (active && revision === current) setRole(null);
            });
        },
        () => {
          ++revision;
          if (active) setRole(null);
        },
      );
    } catch {
      setRole(null);
    }
    return () => {
      active = false;
      ++revision;
      stop();
    };
  }, []);

  return role;
}
