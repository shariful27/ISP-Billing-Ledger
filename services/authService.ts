
export interface User {
  username: string;
  password?: string;
}

const AUTH_KEY = 'isp_auth_user';
const USERS_DB_KEY = 'isp_users_db';

export const authService = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_DB_KEY);
    return data ? JSON.parse(data) : [];
  },

  signup: (user: User): boolean => {
    const users = authService.getUsers();
    if (users.find(u => u.username === user.username)) return false;
    users.push(user);
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    return true;
  },

  login: (user: User): boolean => {
    const users = authService.getUsers();
    const found = users.find(u => u.username === user.username && u.password === user.password);
    if (found) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ username: user.username }));
      return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  }
};
