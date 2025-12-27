
import { API_BASE_URL } from '../../lib/api';

interface FacebookOAuthButtonProps{
    disabled?:boolean;
    className?: string;

}

export default function FacebookOAuthButton({disabled = false, className = ''}: FacebookOAuthButtonProps){
    const handleFacebookLogin = () => {
        const facebookAuthUrl = `${API_BASE_URL}/oauth2/authorization/facebook`;
        window.location.href = facebookAuthUrl;
    };
    return (
        <button
          type="button"
          onClick={handleFacebookLogin}
          disabled={disabled}
          className={`facebook-oauth-button ${className}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #1877f2',
            borderRadius: '8px',
            backgroundColor: '#1877f2',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: disabled ? 0.6 : 1,
            ...(!disabled && {
              ':hover': {
                backgroundColor: '#166fe5',
                boxShadow: '0 2px 8px rgba(24, 119, 242, 0.3)',
              }
            })
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = '#166fe5';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 119, 242, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = '#1877f2';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          {/* Facebook Logo SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="currentColor"
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
          
          {/* Button Text */}
          <span>Continue with Facebook</span>
        </button>
      );
}
