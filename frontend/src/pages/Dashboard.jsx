import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Building2, CheckCircle, XCircle, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { socket, joinQueue, leaveQueue } = useSocket();
  const [tokens, setTokens] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [checkingIn, setCheckingIn] = useState(null);

  useEffect(() => {
    fetchTokens();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (socket) {
      tokens.forEach(token => {
        joinQueue(token.queue._id);
      });

      socket.on('queueUpdate', handleQueueUpdate);
      socket.on('tokenSkipped', handleTokenUpdate);
      socket.on('tokenNoShow', handleTokenUpdate);

      return () => {
        tokens.forEach(token => {
          leaveQueue(token.queue._id);
        });
        socket.off('queueUpdate', handleQueueUpdate);
        socket.off('tokenSkipped', handleTokenUpdate);
        socket.off('tokenNoShow', handleTokenUpdate);
      };
    }
  }, [socket, tokens]);

  const handleQueueUpdate = (data) => {
    fetchTokens();
  };

  const handleTokenUpdate = () => {
    fetchTokens();
  };

  const fetchTokens = async () => {
    try {
      const response = await axios.get('/tokens/my-tokens');
      setTokens(response.data.tokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/tokens/history');
      setHistory(response.data.tokens);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleCancel = async (tokenId) => {
    setCancelling(tokenId);
    try {
      await axios.post(`/tokens/${tokenId}/cancel`);
      fetchTokens();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel token');
    } finally {
      setCancelling(null);
    }
  };

  const handleCheckIn = async (tokenId) => {
    setCheckingIn(tokenId);
    try {
      await axios.post(`/tokens/${tokenId}/checkin`);
      fetchTokens();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to check in');
    } finally {
      setCheckingIn(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'badge-warning';
      case 'checked-in': return 'badge-success';
      case 'being-served': return 'badge-primary';
      default: return 'badge-danger';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'waiting': return 'Waiting';
      case 'checked-in': return 'Checked In';
      case 'being-served': return 'Being Served';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text">My Tokens</h1>
            <p className="text-white/60">Manage your queue bookings</p>
          </div>
          <button
            onClick={fetchTokens}
            className="p-3 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Active Tokens */}
        {tokens.length === 0 ? (
          <div className="card text-center py-16 mb-8">
            <Clock className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Active Tokens</h3>
            <p className="text-white/60 mb-6">You don't have any active queue bookings</p>
            <Link to="/search" className="btn-primary inline-flex items-center gap-2">
              Find a Queue
            </Link>
          </div>
        ) : (
          <div className="space-y-6 mb-12">
            <AnimatePresence>
              {tokens.map((token) => (
                <motion.div
                  key={token._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="card"
                >
                  {/* Token Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">
                          {token.queue.name}
                        </h3>
                        <span className={getStatusColor(token.status)}>
                          {getStatusText(token.status)}
                        </span>
                      </div>
                      <p className="text-white/60 text-sm">{token.queue.purpose}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold gradient-text">#{token.tokenNumber}</p>
                    </div>
                  </div>

                  {/* Business Info */}
                  <div className="flex items-center gap-4 text-sm text-white/50 mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>{token.business.name}</span>
                    </div>
                    {token.business.address?.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{token.business.address.city}</span>
                      </div>
                    )}
                  </div>

                  {/* Queue Status */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-white">{token.queue.currentToken}</p>
                      <p className="text-white/50 text-xs">Now Serving</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-white">{token.peopleAhead}</p>
                      <p className="text-white/50 text-xs">Ahead of You</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-primary-400">
                        {token.status === 'being-served' ? 'Now' : 
                         token.peopleAhead === 0 ? 'Next' : 
                         `${token.peopleAhead * 15}m`}
                      </p>
                      <p className="text-white/50 text-xs">Est. Time</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${Math.max(0, Math.min(100, 
                            (token.queue.currentToken / token.tokenNumber) * 100
                          ))}%` 
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {token.status === 'waiting' && (
                      <button
                        onClick={() => handleCheckIn(token._id)}
                        disabled={checkingIn === token._id}
                        className="flex-1 btn-success py-3 flex items-center justify-center gap-2"
                      >
                        {checkingIn === token._id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Check In
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleCancel(token._id)}
                      disabled={cancelling === token._id}
                      className="flex-1 btn-danger py-3 flex items-center justify-center gap-2"
                    >
                      {cancelling === token._id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          Cancel
                        </>
                      )}
                    </button>
                  </div>

                  {token.status === 'being-served' && (
                    <div className="mt-4 p-4 bg-success-500/10 border border-success-500/30 rounded-xl flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-success-400" />
                      <p className="text-success-400 font-medium">
                        It's your turn! Please proceed to the counter.
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">History</h2>
            <div className="space-y-3">
              {history.slice(0, 5).map((token) => (
                <div
                  key={token._id}
                  className="card py-4 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-white/40">
                        #{token.tokenNumber}
                      </span>
                      <div>
                        <p className="text-white font-medium">{token.queue.name}</p>
                        <p className="text-white/50 text-sm">{token.business.name}</p>
                      </div>
                    </div>
                    <span className={`badge ${
                      token.status === 'completed' ? 'badge-success' : 
                      token.status === 'cancelled' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {token.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
