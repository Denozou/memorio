export type Tokens = {
    accessToken: string;
    refreshToken: string;
    tokenType?: string;
    accessExp?: string;
};

const ACCESS = "accessToken";
const REFRESH = "refreshToken";
const TYPE = "tokenType";
const EXP = "accessExp";

export function saveTokens(t: Tokens){
    if (t.accessToken){
        localStorage.setItem(ACCESS, t.accessToken);
    }
    if (t.refreshToken){
        localStorage.setItem(REFRESH, t.refreshToken);
    }
    if (t.tokenType){
        localStorage.setItem(TYPE, t.tokenType);
    }
    if (t.accessExp){
        localStorage.setItem(EXP, t.accessExp);
    }

    
}

export function getAccessToken(){ return localStorage.getItem(ACCESS); }
export function getRefreshToken(){ return localStorage.getItem(REFRESH); }
export function getTokenType(){ return localStorage.getItem(TYPE) ?? "Bearer"; }
export function getAccessExp(){ return localStorage.getItem(EXP); }

export function clearTokens(){
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(TYPE);
    localStorage.removeItem(EXP);
}

export function isAccessExpired (offsetSeconds = 10): boolean{
    const exp = getAccessExp();
    if (!exp){
        return false;
    }
    const expMs = Date.parse(exp);
    if(Number.isNaN(expMs)){
        return false;
    }
    const nowMs = Date.now();
    return nowMs >= expMs - offsetSeconds * 1000;
}