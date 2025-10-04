import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OAuth2Success(){
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Check if OAuth2 was successful
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (error) {
            console.error('OAuth2 authentication failed:', error);
            navigate('/login?error=oauth2_failed', {replace: true});
            return;
        }

        // if (success === 'true') {
        //     // OAuth2 was successful, cookies should already be set by the backend
        //     // Navigate to dashboard
        //     navigate('/dashboard', { replace: true});
        // } else {
        //     console.error('OAuth2 authentication incomplete');
        //     navigate('/login?error=oauth2_missing_tokens', {replace: true});
        // }
        setTimeout(() => {
            navigate('/dashboard', { replace: true});
        }, 500);
    }, [searchParams, navigate]);

    return (
        <div style={{
          fontFamily: "system-ui",
          padding: 24,
          display: "grid",
          placeItems: "center",
          minHeight: "100vh"
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 40,
              height: 40,
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <h2 style={{ margin: 0, color: '#333' }}>Completing sign in...</h2>
            <p style={{ margin: '8px 0 0', color: '#666' }}>
              Processing your authentication
            </p>
          </div>

          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
}