import {useState} from "react";
import {api} from "../lib/api";
import {saveTokens} from "../lib/auth";
import {useNavigate} from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
type LoginResp = {
    accessToken: string,
    refreshToken: string,
    tokenType: string,
    expiresAt: string
};
export default function Login(){
    const nav = useNavigate();
    const [email, setEmail] = useState("jwt@test.com");
    const [password, setPassword] = useState("secrett");
    const [error, setError] = useState<string|null>(null);
    const [busy, setBusy] = useState(false);

    async function onSubmit(e: React.FormEvent){
        e.preventDefault();
        setBusy(true);
        setError(null);
        try{
            const {data} = await api.post<LoginResp>("/auth/login", {email, password});
            saveTokens({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                tokenType: data.tokenType,
                accessExp: data.expiresAt,
            });
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
        </form>
      </CardContent>
    </Card>
  </div>
    );   
}