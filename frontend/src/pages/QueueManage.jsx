import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, SkipForward, UserX, UserCheck, RefreshCw, Users, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

const QueueManage = () => {
  const { id } = useParams();
  const { socket, joinQueue, leaveQueue } = useSocket();
  const [queue, setQueue] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchQueueData();
    joinQueue(id);

    if (socket) {
      socket.on('queueUpdate', handleQueueUpdate);
      socket.on('tokenCreated', handleTokenUpdate);
      socket.on('tokenCancelled', handleTokenUpdate);
      socket.on('tokenCheckedIn', handleTokenUpdate);
    }

    return () => {
      leaveQueue(id);
      if (socket) {
        socket.off('queueUpdate', handleQueueUpdate);
        socket.off('tokenCreated', handleTokenUpdate);
        socket.off('tokenCancelled', handleTokenUpdate);
        socket.off('tokenCheckedIn', handleTokenUpdate);
      }
    };
  }, [id, socket]);

  const handleQueueUpdate = (data) => {
    if (data.queueId === id) {
      fetchQueueData();
    }
  };

  const handleTokenUpdate = () => {
    fetchQueueData();
  };

  const fetchQueueData = async () => {
    try {
      const [queueRes, tokensRes] = await Promise.all([
        axios.get(`/queues/${id}`),
        axios.get(`/tokens/queue/${id}`)
      ]);
      setQueue(queueRes.data.queue);
      setTokens(tokensRes.data.tokens);
    } catch (error) {
      console.error('Error fetching queue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    setActionLoading('next');
    try {
      await axios.post(`/queues/${id}/next`);
      fetchQueueData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to move to next');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkip = async (tokenNumber) => {
    setActionLoading(`skip-${tokenNumber}`);
    try {
      await axios.post(`/queues/${id}/skip/${tokenNumber}`);
      fetchQueueData();
    } catch (error) {
      alert('Failed to skip token');
    } finally {
      setActionLoading(null);
    }
  };

  const handleNoShow = async (tokenNumber) => {
    setActionLoading(`noshow-${tokenNumber}`);
    try {
      await axios.post(`/queues/${id}/noshow/${tokenNumber}`);
      fetchQueueData();
    } catch (error) {
      alert('Failed to mark no-show');
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualCheckIn = async (tokenId) => {
    setActionLoading(`checkin-${tokenId}`);
    try {
      await axios.post(`/tokens/${tokenId}/manual-checkin`);
      fetchQueueData();
    } catch (error) {
      alert('Failed to check in');
    } finally {
      setActionLoading(null);
    }
  };

  const waitingTokens = tokens.filter(t => ['waiting', 'checked-in'].includes(t.status));
  const beingServed = tokens.find(t => t.status === 'being-served');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60">Queue not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/owner"
          className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{queue.name}</h1>
                <span className={`badge ${
                  queue.status === 'active' ? 'badge-success' : 
                  queue.status === 'paused' ? 'badge-warning' : 'badge-danger'
                }`}>
                  {queue.status}
                </span>
              </div>
              <p className="text-white/60">{queue.purpose}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchQueueData}
                className="p-3 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <div className="text-right">
                <p className="text-sm text-white/50">Queue ID</p>
                <p className="font-mono text-primary-400 font-semibold">{queue.queueId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <motion.div
            key={queue.currentToken}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            className="card text-center md:col-span-2"
          >
            <p className="text-white/60 mb-2">Now Serving</p>
            <p className="token-display">#{queue.currentToken}</p>
            
            {beingServed && (
              <div className="mt-4 p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-400">
                      {beingServed.user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">{beingServed.user.name}</p>
                    <p className="text-white/50 text-sm">Token #{beingServed.tokenNumber}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleNext}
                disabled={actionLoading === 'next' || waitingTokens.length === 0}
                className="flex-1 btn-success py-4 flex items-center justify-center gap-2"
              >
                {actionLoading === 'next' ? (
                  <div className="spinner w-5 h-5" />
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Next Token
                  </>
                )}
              </button>
            </div>
          </motion.div>

          <div className="space-y-4">
            <div className="card text-center">
              <Users className="w-8 h-8 text-primary-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{waitingTokens.length}</p>
              <p className="text-white/60">Waiting</p>
            </div>
            <div className="card text-center">
              <Clock className="w-8 h-8 text-accent-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{queue.nextToken - 1}</p>
              <p className="text-white/60">Total Tokens</p>
            </div>
          </div>
        </div>

        {/* Waiting List */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Waiting List
          </h3>

          {waitingTokens.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No one is waiting</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {waitingTokens.map((token, index) => (
                  <motion.div
                    key={token._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-lg font-bold text-primary-400">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-white">#{token.tokenNumber}</span>
                          <span className={`badge ${
                            token.status === 'checked-in' ? 'badge-success' : 'badge-warning'
                          }`}>
                            {token.status === 'checked-in' ? 'Checked In' : 'Waiting'}
                          </span>
                        </div>
                        <p className="text-white/60">{token.user.name}</p>
                        <p className="text-white/40 text-sm">{token.user.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {token.status === 'waiting' && (
                        <button
                          onClick={() => handleManualCheckIn(token._id)}
                          disabled={actionLoading === `checkin-${token._id}`}
                          className="p-2 rounded-lg bg-success-500/10 text-success-400 hover:bg-success-500/20 transition-all"
                          title="Manual Check-in"
                        >
                          {actionLoading === `checkin-${token._id}` ? (
                            <div className="spinner w-4 h-4" />
                          ) : (
                            <UserCheck className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleSkip(token.tokenNumber)}
                        disabled={actionLoading === `skip-${token.tokenNumber}`}
                        className="p-2 rounded-lg bg-warning-500/10 text-warning-400 hover:bg-warning-500/20 transition-all"
                        title="Skip"
                      >
                        {actionLoading === `skip-${token.tokenNumber}` ? (
                          <div className="spinner w-4 h-4" />
                        ) : (
                          <SkipForward className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleNoShow(token.tokenNumber)}
                        disabled={actionLoading === `noshow-${token.tokenNumber}`}
                        className="p-2 rounded-lg bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 transition-all"
                        title="No Show"
                      >
                        {actionLoading === `noshow-${token.tokenNumber}` ? (
                          <div className="spinner w-4 h-4" />
                        ) : (
                          <UserX className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueManage;
