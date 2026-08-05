/**
 * Local Authentication Fallback
 * Works entirely in-browser when Firebase network requests are blocked.
 */

const LOCAL_USERS_KEY = 'freshkeep_local_users';

interface LocalUser {
  uid: string;
  email: string;
  displayName: string;
  passwordHash: string;
  photoURL: string | null;
  createdAt: string;
}

function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function getLocalUsers(): LocalUser[] {
  try {
    const data = localStorage.getItem(LOCAL_USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalUsers(users: LocalUser[]): void {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

export function localUserExists(email: string): boolean {
  const users = getLocalUsers();
  return users.some(u => u.email.toLowerCase() === email.toLowerCase());
}

export function localRegister(email: string, password: string, name: string): LocalUser {
  const users = getLocalUsers();
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    const err: any = new Error('Email already in use');
    err.code = 'auth/email-already-in-use';
    throw err;
  }

  const newUser: LocalUser = {
    uid: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    displayName: name,
    passwordHash: simpleHash(password),
    photoURL: null,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveLocalUsers(users);
  return newUser;
}

export function localSignIn(email: string, password: string): LocalUser {
  const users = getLocalUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    const err: any = new Error('No account found. Please register first.');
    err.code = 'auth/user-not-found';
    throw err;
  }

  if (user.passwordHash !== simpleHash(password)) {
    const err: any = new Error('Incorrect password.');
    err.code = 'auth/wrong-password';
    throw err;
  }

  return user;
}

/**
 * Smart sign-in: if account exists locally → verify password and sign in.
 * If no account exists locally → auto-register and sign in (first-time user).
 */
export function localSmartSignIn(email: string, password: string, name?: string): LocalUser {
  const users = getLocalUsers();
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    // Account exists — verify password
    if (existing.passwordHash !== simpleHash(password)) {
      const err: any = new Error('Incorrect password. Please try again.');
      err.code = 'auth/wrong-password';
      throw err;
    }
    return existing;
  }

  // No account yet — auto-register (first sign-in = auto-create)
  const newUser: LocalUser = {
    uid: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    displayName: name || email.split('@')[0],
    passwordHash: simpleHash(password),
    photoURL: null,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveLocalUsers(users);
  return newUser;
}

export function localUserToFirebaseLike(user: LocalUser) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    providerData: [{ providerId: 'password' }],
    getIdToken: async () => `local_token_${user.uid}`,
  };
}
