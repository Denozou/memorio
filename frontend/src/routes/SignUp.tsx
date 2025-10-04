import {useState} from "react";
import {api} from "../lib/api";
import {useNavigate, Link} from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import GoogleOAuthButton from "../components/ui/GoogleOAuthButton";
import FacebookOAuthButton from "../components/ui/FacebookOAuthButton";

type RegisterResp = {
    message: string;
    user: {
        id: string;
        email: string;
        displayName: string;
        role: string;
    };
};

export default function SignUp(){
    const nav = useNavigate();

    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string|null>(null);
    const [busy, setBusy] = useState(false);

    async function onSubmit(e: React.FormEvent){
        e.preventDefault();
        setBusy(true);
        setError(null);

        // Client-side validation
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setBusy(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 8 characters long");
            setBusy(false);
            return;
        }

        try{
            const {data} = await api.post<RegisterResp>("/auth/register", {
                displayName,
                email,
                password,
                confirmPassword,
                preferredLanguage: "en"
            });

            nav("/dashboard");
        }catch(err: any){
            const msg = err?.response?.data?.error ?? "Registration failed";
            setError(msg);
        }finally{
            setBusy(false);
        }
    }

    return (
        <div style={{ fontFamily: "system-ui", padding: 24, display: "grid", placeItems: "center" }}>
            <Card style={{ width: 420 }}>
                <CardHeader title="Create Account" subtitle="Join Memorio to start learning" />
                <CardContent>
                    <form onSubmit={onSubmit} style={{ display: "grid", gap: 14, width:"100%", boxSizing: "border-box" }}>
                        <Input
                            label="Display Name"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            placeholder="Your full name"
                            type="text"
                            required
                        />
                        <Input
                            label="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            type="email"
                            required
                        />
                        <Input
                            label="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            type="password"
                            passwordToggle
                            required
                        />
                        <Input
                            label="Confirm Password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            type="password"
                            passwordToggle
                            required
                        />
                        {error && <div style={{ color: "#ef4444", fontSize: "14px" }}>{error}</div>}
                        <Button loading={busy} type="submit" variant="primary" full>
                            Create Account
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

                        {/* Sign in link */}
                        <div style={{
                            textAlign: 'center',
                            marginTop: '16px',
                            fontSize: '14px',
                            color: '#6b7280'
                        }}>
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                style={{
                                    color: '#3b82f6',
                                    textDecoration: 'none',
                                    fontWeight: '500'
                                }}
                            >
                                Sign in
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
