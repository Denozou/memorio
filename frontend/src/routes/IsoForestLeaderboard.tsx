import { useEffect, useState } from 'react';
import { Trophy, Sprout, TrendingUp, Info, X, Maximize2, ChevronLeft, ChevronRight, Loader2, Brain, LogOut, Menu, Lightbulb } from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '../components/ThemeToggle';
import { IsoForestPlot } from '../components/IsoForest';
import ReviewNotificationBadge from '../components/ReviewNotificationBadge';
import { useTutorial } from '../contexts/TutorialContext';

type LeaderboardEntry = {
  userId: string;
  displayName: string;
  pictureUrl: string | null;
  totalPoints: number;
  trees: number;
  level: number;
  rank: number;
  isCurrentUser: boolean;
};

type LeaderboardPage = {
  pageNumber: number;
  totalPages: number;
  startRank: number;
  endRank: number;
  entries: LeaderboardEntry[];
  isCurrentUserPage: boolean;
};

type LeaderboardResponse = {
  currentPage: LeaderboardPage;
  currentUserRank: number;
  totalUsers: number;
  nextPageNumber: number | null;
  previousPageNumber: number | null;
};

const UserRow = ({ user, onSelect, t }: {
  user: LeaderboardEntry;
  onSelect: (user: LeaderboardEntry) => void;
  t: any;
}) => {
  const rank = user.rank;
  const rankColors = {
    1: 'border-yellow-400 bg-yellow-50/30 dark:bg-yellow-900/10 dark:border-yellow-500',
    2: 'border-slate-300 bg-slate-50/50 dark:bg-slate-800/30 dark:border-slate-600',
    3: 'border-amber-600 bg-orange-50/30 dark:bg-orange-900/10 dark:border-amber-500',
    default: 'border-transparent bg-white dark:bg-slate-800 hover:border-emerald-200 dark:hover:border-emerald-700'
  };

  const getRankBadge = (r: number) => {
    if (r === 1) return <Trophy className="w-6 h-6" style={{ color: '#fbbf24', fill: '#fbbf24' }} />;
    if (r === 2) return <span className="font-bold text-slate-500 dark:text-slate-300 text-xl">#2</span>;
    if (r === 3) return <span className="font-bold text-amber-700 dark:text-amber-400 text-xl">#3</span>;
    return <span className="font-bold text-slate-400 dark:text-slate-400 text-lg">#{r}</span>;
  };

  const avatarUrl = user.pictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(user)}
      aria-label={`${t('leaderboard.viewForest', 'View forest for')} ${user.displayName}, ${t('leaderboard.rank')} ${rank}`}
      className={`
        w-full text-left relative group flex flex-col md:flex-row items-center gap-4 md:gap-6 p-4 
        rounded-2xl shadow-sm border-2 transition-all duration-300 cursor-pointer hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900
        ${rank <= 3 ? (rankColors as any)[rank] : rankColors.default}
        ${user.isCurrentUser ? 'ring-2 ring-emerald-500 dark:ring-emerald-400' : ''}
      `}
    >
      <div className="flex items-center gap-4 w-full md:w-64 shrink-0 z-10">
        <div className="w-10 flex items-center justify-center flex-shrink-0">{getRankBadge(rank)}</div>
        <div className="relative flex-shrink-0">
          <img
            src={avatarUrl}
            alt={user.displayName}
            className="w-14 h-14 rounded-full border-4 border-white dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-600 object-cover"
          />
          <div 
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold shadow-lg border-2 whitespace-nowrap"
            style={{ 
              backgroundColor: rank === 1 ? '#facc15' : '#10b981', 
              color: rank === 1 ? '#0f172a' : '#ffffff',
              borderColor: rank === 1 ? '#facc15' : '#10b981',
              borderRadius: '10px', 
              paddingLeft: '10px', 
              paddingRight: '10px', 
              paddingTop: '2px', 
              paddingBottom: '2px',
              minWidth: '42px',
              textAlign: 'center'
            }}
          >
            {t('leaderboard.lvl')} {user.level}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">
            {user.displayName}
            {user.isCurrentUser && <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">({t('leaderboard.you')})</span>}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1">
            {t('leaderboard.tapToVisit')} <Maximize2 size={10} />
          </span>
        </div>
      </div>

      <div className="relative flex-grow w-full h-32 md:h-40 -my-4 md:-my-8 pointer-events-none">
        <IsoForestPlot count={user.trees} seedId={user.userId} width={400} height={200} />
      </div>

      <div className="flex items-center justify-center gap-6 z-10 w-full">
        <div className="text-center">
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 leading-none">{user.trees}</div>
          <div className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold tracking-wider">{t('leaderboard.trees')}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{user.totalPoints.toLocaleString()} {t('leaderboard.points').toLowerCase()}</div>
        </div>
      </div>
    </button>
  );
};

const ForestModal = ({ user, onClose, t }: {
  user: LeaderboardEntry | null;
  onClose: () => void;
  t: any;
}) => {
  if (!user) return null;

  const treesToNextLevel = (user.level * 10) - user.trees;
  const progressPercent = ((10 - treesToNextLevel) / 10) * 100;
  const avatarUrl = user.pictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-50 dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]">
        
        <div className="relative w-full md:w-2/3 bg-gradient-to-b from-sky-200 to-sky-100 dark:from-sky-900 dark:to-sky-800 overflow-hidden flex items-center justify-center min-h-[300px] md:min-h-0">
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.4)_0%,transparent_60%)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_60%)] animate-pulse" />
          <div className="w-full h-full scale-125 md:scale-100 p-8">
            <IsoForestPlot count={user.trees} seedId={user.userId} width={800} height={600} maxCapacity={400} isInteractive={true} />
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-slate-700 dark:text-slate-200 md:hidden z-50">
            <X size={24} />
          </button>
        </div>

        <div className="w-full md:w-1/3 bg-white dark:bg-slate-800 border-l border-slate-100 dark:border-slate-700 flex flex-col relative z-20">
          <div className="p-4 flex justify-end hidden md:flex">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
              <X size={24} />
            </button>
          </div>

          <div className="px-8 pb-8 flex flex-col overflow-y-auto">
            <div className="mb-8 text-center md:text-left">
              <div className="relative inline-block mb-3">
                <img src={avatarUrl} className="w-20 h-20 rounded-full border-4 border-slate-50 dark:border-slate-700 shadow-lg mx-auto md:mx-0" alt={user.displayName} />
                <div 
                  className="absolute -bottom-2 -right-2 text-xs font-bold px-2 py-1 rounded-full shadow-sm border-2 border-white dark:border-yellow-300"
                  style={{ backgroundColor: '#facc15', color: '#0f172a' }}
                >
                  #{user.rank}
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{user.displayName}</h2>
              <p className="text-slate-500 dark:text-slate-300 font-medium">{t('leaderboard.level')} {user.level} Grower</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wide">{t('leaderboard.currentRank')}</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-300">{user.level}</span>
              </div>
              <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-300 text-center">
                {treesToNextLevel} more {t('leaderboard.trees').toLowerCase()} to reach {t('leaderboard.level')} {user.level + 1}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                <div className="text-blue-900 dark:text-blue-200 font-black text-xl">{(user.trees * 25).toLocaleString()}</div>
                <div className="text-blue-600 dark:text-blue-200 text-[10px] uppercase font-bold tracking-wider">kg CO₂</div>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-center">
                <div className="text-orange-900 dark:text-orange-200 font-black text-xl">{user.trees}</div>
                <div className="text-orange-600 dark:text-orange-200 text-[10px] uppercase font-bold tracking-wider">{t('leaderboard.trees')}</div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                <div className="text-purple-900 dark:text-purple-200 font-black text-xl">{user.totalPoints.toLocaleString()}</div>
                <div className="text-purple-600 dark:text-purple-200 text-[10px] uppercase font-bold tracking-wider">{t('leaderboard.points')}</div>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
                <div className="text-emerald-900 dark:text-emerald-200 font-black text-xl">#{user.rank}</div>
                <div className="text-emerald-600 dark:text-emerald-200 text-[10px] uppercase font-bold tracking-wider">{t('leaderboard.rank')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function IsoForestLeaderboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showTutorial } = useTutorial();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async (pageNumber?: number) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = pageNumber ? `/api/leaderboard/page/${pageNumber}` : '/api/leaderboard';
      const { data } = await api.get(endpoint);
      
      // Handle both response formats:
      // - /leaderboard returns { currentPage: {...}, currentUserRank, totalUsers, ... }
      // - /leaderboard/page/{n} returns the page directly { entries: [...], pageNumber, ... }
      let normalizedData: LeaderboardResponse;
      
      if (data.currentPage) {
        // Full response from /leaderboard
        normalizedData = data as LeaderboardResponse;
      } else if (data.entries !== undefined) {
        // Direct page response from /leaderboard/page/{n} - wrap it
        normalizedData = {
          currentPage: data as LeaderboardPage,
          currentUserRank: leaderboardData?.currentUserRank ?? 0,
          totalUsers: leaderboardData?.totalUsers ?? 0,
          nextPageNumber: (data.pageNumber < data.totalPages) ? data.pageNumber + 1 : null,
          previousPageNumber: (data.pageNumber > 1) ? data.pageNumber - 1 : null,
        };
      } else {
        throw new Error('Invalid response format from leaderboard API');
      }
      
      setLeaderboardData(normalizedData);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? t('leaderboard.loading'));
    } finally {
      setLoading(false);
    }
  };

  const totalTrees = leaderboardData?.currentPage?.entries?.reduce((acc, curr) => acc + curr.trees, 0) ?? 0;
  const carbonOffset = (totalTrees * 25).toLocaleString();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      <style>{`
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0) translateY(10px); }
          70% { transform: scale(1.1) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {selectedUser && <ForestModal user={selectedUser} onClose={() => setSelectedUser(null)} t={t} />}

      {/* Header Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-700/50 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 backdrop-blur">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold tracking-tight text-white">Memorio</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-sm text-slate-300 hover:text-white inline-flex items-center">
                {t('common.dashboard')}
                <ReviewNotificationBadge />
              </Link>
              <Link to="/leaderboard" className="text-sm text-white font-medium">
                {t('common.leaderboard')}
              </Link>
              <Link to="/learning" className="text-sm text-slate-300 hover:text-white">
                {t('common.learning')}
              </Link>
              <Link to="/profile" className="text-sm text-slate-300 hover:text-white">
                {t('common.profile')}
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={showTutorial}
                className="px-4 py-2 rounded-xl border border-purple-600 text-sm text-purple-400 hover:bg-purple-900/30 transition-colors flex items-center gap-2"
                title={t('tutorial.viewTutorial', 'View Tutorial')}
              >
                <Lightbulb className="w-4 h-4" />
                <span className="hidden lg:inline">{t('tutorial.tutorial', 'Tutorial')}</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {t('common.logout')}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                className="p-2 rounded-lg border border-slate-700 text-slate-300"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-slate-700/50 dark:border-slate-800">
              <div className="flex flex-col gap-2">
                <Link to="/dashboard" className="py-2 text-slate-300 hover:text-white inline-flex items-center" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.dashboard')}
                  <ReviewNotificationBadge />
                </Link>
                <Link to="/leaderboard" className="py-2 text-white font-medium" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.leaderboard')}
                </Link>
                <Link to="/learning" className="py-2 text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.learning')}
                </Link>
                <Link to="/profile" className="py-2 text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.profile')}
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); showTutorial(); }}
                  className="py-2 text-left text-purple-400 flex items-center gap-2"
                >
                  <Lightbulb className="w-4 h-4" />
                  {t('tutorial.tutorial', 'Tutorial')}
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="py-2 text-left text-slate-300 hover:text-white flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-slate-300" />
                  {t('common.logout')}
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      <div className="bg-slate-900 dark:bg-slate-950 text-white pt-12 pb-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute top-[20%] -left-[10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
                {t('leaderboard.memorioCommunity')}
              </div>
              <h1 className="text-3xl md:text-5xl font-black flex flex-col gap-1 md:gap-3 mb-3 md:mb-4">
                <span>{t('leaderboard.impactForest')}</span>
              </h1>
              <p className="text-slate-400 max-w-lg text-base md:text-lg leading-relaxed">
                {t('leaderboard.communityGrowDesc')}
              </p>
            </div>

            <div className="mt-6 md:mt-0 p-4 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 text-center min-w-[140px] self-end md:self-auto">
              <div className="text-3xl md:text-4xl font-black text-emerald-400">{leaderboardData?.totalUsers || 0}</div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mt-1">{t('leaderboard.totalPlayers')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-20 pb-12">
        {loading && !leaderboardData ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 animate-spin mb-4" />
            <p className="text-slate-600 dark:text-slate-300">{t('leaderboard.loading')}</p>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-12 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button onClick={() => fetchLeaderboard()} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              {t('common.submit')}
            </button>
          </div>
        ) : leaderboardData ? (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 md:p-6 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg flex-shrink-0">
                  <Sprout size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Page Impact</div>
                  <div className="font-bold text-slate-800 dark:text-slate-100 truncate">{carbonOffset} kg CO₂</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg flex-shrink-0">
                  <TrendingUp size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{t('leaderboard.yourRank')}</div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">#{leaderboardData.currentUserRank}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg flex-shrink-0">
                  <Info size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Viewing Page</div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">{leaderboardData.currentPage?.pageNumber ?? 1} of {leaderboardData.currentPage?.totalPages ?? 1}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 px-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-200">
                {t('leaderboard.topPlayers')} ({t('leaderboard.rank')} {leaderboardData.currentPage?.startRank ?? 1}-{leaderboardData.currentPage?.endRank ?? 1})
              </h2>
              <div className="flex gap-2 self-end sm:self-auto">
                {!leaderboardData.currentPage?.isCurrentUserPage && (
                  <button onClick={() => fetchLeaderboard()} className="px-3 py-1 text-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors font-medium">
                    {t('leaderboard.yourRank')}
                  </button>
                )}
                <button onClick={() => leaderboardData.previousPageNumber && fetchLeaderboard(leaderboardData.previousPageNumber)} disabled={!leaderboardData.previousPageNumber} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <ChevronLeft size={20} className="text-slate-700 dark:text-slate-300" />
                </button>
                <button onClick={() => leaderboardData.nextPageNumber && fetchLeaderboard(leaderboardData.nextPageNumber)} disabled={!leaderboardData.nextPageNumber} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <ChevronRight size={20} className="text-slate-700 dark:text-slate-300" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {leaderboardData.currentPage?.entries?.length ? (
                leaderboardData.currentPage.entries.map((user) => (
                  <UserRow key={user.userId} user={user} onSelect={setSelectedUser} t={t} />
                ))
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-12 text-center">
                  <p className="text-slate-500 dark:text-slate-400">{t('leaderboard.noEntries', 'No entries found')}</p>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
