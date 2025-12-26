import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function RequestPasswordReset() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/auth/password-reset/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setIsSubmitted(true);
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to send reset email');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 px-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-lg shadow-xl p-8 border border-slate-200 dark:border-slate-800">
                    <div className="text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 dark:text-green-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-50 mb-2">Check Your Email</h2>
                        <p className="text-gray-600 dark:text-slate-300 mb-6">
                            If an account exists with {email}, you will receive a password reset link shortly.
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center text-blue-600 dark:text-indigo-400 hover:text-blue-700 dark:hover:text-indigo-300 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-lg shadow-xl p-8 border border-slate-200 dark:border-slate-800">
                <div className="text-center mb-8">
                    <Mail className="w-12 h-12 text-blue-600 dark:text-indigo-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-slate-50 mb-2">Reset Password</h2>
                    <p className="text-gray-600 dark:text-slate-300">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
                            placeholder="you@example.com"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-blue-600 dark:bg-indigo-600 hover:bg-blue-700 dark:hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center text-sm text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}