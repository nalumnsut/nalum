import apiClient from "@/lib/api";

type RoleConfig = {
  needsProfileCheck: boolean;
  postLoginPath: (profileCompleted?: boolean) => string;
};

const ROLE_CONFIG: Record<string, RoleConfig> = {
  admin: {
    needsProfileCheck: false,
    postLoginPath: () => '/admin-panel/dashboard',
  },
  alumni: {
    needsProfileCheck: true,
    postLoginPath: (profileCompleted) => profileCompleted ? '/dashboard' : '/profile-form',
  },
  student: {
    needsProfileCheck: true,
    postLoginPath: (profileCompleted) => profileCompleted ? '/dashboard' : '/profile-form',
  },
  faculty: {
    needsProfileCheck: true,
    postLoginPath: (profileCompleted) => profileCompleted ? '/dashboard' : '/profile-form',
  },
};

export const resolvePostLoginPath = async (
  role: string,
  accessToken: string
): Promise<string> => {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG['student'];
  if (!config.needsProfileCheck) return config.postLoginPath();
  try {
    const { data } = await apiClient.get('/profile/status', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return config.postLoginPath(data.profileCompleted);
  } catch {
    return '/dashboard';
  }
};
