import {useState, useEffect} from "react";
import {api} from "../lib/api";
import {useNavigate, useSearchParams, Link} from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import GoogleOAuthButton from "../components/ui/GoogleOAuthButton";
import FacebookOAuthButton from "../components/ui/FacebookOAuthButton";

type LoginResp = {
    message: string;
    user: {
        id: string;
        email: string;
        displayName: string;
        role: string;
    };
};

export default function Login(){
    const nav = useNavigate();
    const [searchParams] = useSearchParams();

    const [email, setEmail] = useState("jwt@test.com");
    const [password, setPassword] = useState("secrett");
    const [error, setError] = useState<string|null>(null);
    const [busy, setBusy] = useState(false);
    useState(()=> {
      const oauthError = searchParams.get('error');
      if (oauthError === 'oauth2_failed'){
        setError('Google sign-in failed. Please try again');
      }else if (oauthError === 'oauth2_missing_tokens'){
        setError('Google sign-in was incomplete. Please try again');
      }
    });
    async function onSubmit(e: React.FormEvent){
        e.preventDefault();
        setBusy(true);
        setError(null);
        try{
            const {data} = await api.post<LoginResp>("/auth/login", {email, password});
            nav("/dashboard");
        }catch(err: any){
            const msg = err?.response?.data?.message ?? "Login failed";
            setError(msg);
        }finally{
            setBusy(false);
        }
    }
    return (
      <div style={{ fontFamily: "system-ui", padding: 24, display: "grid", placeItems: "center" }}>
        <Card style={{ width: 420 }}>
          <CardHeader title="Sign in" subtitle="Use your Memorio account" />
          <CardContent>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
              <Input
                label="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
              />
              <Input
                label="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                passwordToggle
              />
              {error && <div style={{ color: "#ef4444" }}>{error}</div>}
              <Button loading={busy} type="submit" variant="primary" full>
                Sign in
              </Button>

              {/* Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '8px 0'
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
                <span style={{ color: '#6b7280', fontSize: '14px' }}>or</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
              </div>

              <GoogleOAuthButton disabled={busy} />
              <FacebookOAuthButton disabled={busy}/>

            </form>
            <p>
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
          </CardContent>
        </Card>
    </div>
  );   
}