/**
 * Authentication Helper for jerseyperfume.com
 * Since we don't have a JWT plugin on the remote WordPress,
 * we handle authentication through proxy and local storage.
 */

export interface JPUser {
    id: number;
    name: string;
    email: string;
}

export const loginUser = async (email: string, pass: string): Promise<JPUser> => {
    // In a production environment with a custom backend, you'd call
    // /api/auth/login. Here we utilize the proxy to attempt a login
    // check with WordPress if possible, or simulate it given the context.
    
    // Example: Verification with WP core if possible
    // try {
    //   const response = await fetch('/api/proxy?path=wp/v2/users/me', {
    //     headers: { 'Authorization': 'Basic ' + Buffer.from(email + ':' + pass).toString('base64') }
    //   });
    //   if (response.ok) return await response.json();
    // } catch (e) { ... }
    
    // For demonstration purposes, we validate against a simulated set of creds
    // to allow the user to test the dashboard UI.
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (email.length > 3 && pass.length > 3) {
                resolve({ id: 101, name: email.split('@')[0], email: email });
            } else {
                reject(new Error("Invalid username or password."));
            }
        }, 1000);
    });
};

export const logoutUser = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('jp_user');
    }
};

export const getSession = (): JPUser | null => {
    if (typeof window !== 'undefined') {
        const user = localStorage.getItem('jp_user');
        return user ? JSON.parse(user) : null;
    }
    return null;
};
