interface AuthState {
    isSignedIn: boolean;
    username: string,
    userID: string,
}

type AuthContext = {
     isSignedIn: boolean;
     userID: string|null;
     username: string|null;
     refreshAuth:()=> Promise<boolean>;
     signIn:() => Promise<boolean>;
     signOut:() => Promise<boolean>;}