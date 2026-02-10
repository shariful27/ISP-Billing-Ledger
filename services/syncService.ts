
export const syncService = {
  // Bundle all ISP data (Auth + Business) into one string
  generateSyncCode: (): string => {
    const authData = localStorage.getItem('isp_auth_user');
    const usersDb = localStorage.getItem('isp_users_db');
    const businessData = localStorage.getItem('isp_billing_data_v2');
    
    const payload = {
      auth: authData ? JSON.parse(authData) : null,
      users: usersDb ? JSON.parse(usersDb) : [],
      business: businessData ? JSON.parse(businessData) : [],
      timestamp: Date.now()
    };
    
    // Encode to base64 to make it easy to copy-paste
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  },

  // Restore everything from a sync code
  restoreFromCode: (code: string): boolean => {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(code))));
      
      if (decoded.users) localStorage.setItem('isp_users_db', JSON.stringify(decoded.users));
      if (decoded.business) localStorage.setItem('isp_billing_data_v2', JSON.stringify(decoded.business));
      // We don't necessarily restore the active session (auth) to force a fresh login
      
      return true;
    } catch (e) {
      console.error("Invalid Sync Code", e);
      return false;
    }
  }
};
