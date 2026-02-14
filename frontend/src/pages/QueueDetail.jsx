import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Users, MapPin, Building2, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const QueueDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, joinQueue, leaveQueue } = useSocket();
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchQueue();
    joinQueue(id);

    if (socket) {
      socket.on('queueUpdate', handleQueueUpdate);
      socket.on('tokenCreated', handleTokenUpdate);
      socket.on('tokenCancelled', handleTokenUpdate);
    }

    return () => {
      leaveQueue(id);
      if (socket) {
        socket.off('queueUpdate', handleQueueUpdate);
        socket.off('tokenCreated', handleTokenUpdate);
        socket.off('tokenCancelled', handleTokenUpdate);
      }
    };
  }, [id, socket]);

  const handleQueueUpdate = (data) => {
    if (data.queueId === id) {
      setQueue(prev => ({ ...prev, currentToken: data.currentToken }));
    }
  };

  const handleTokenUpdate = () => {
    fetchQueue();
  };

  const fetchQueue = async () => {
    try {
      const response = await axios.get(`/queues/${id}`);
      setQueue(response.data.queue);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookToken = async () => {
    if (!user) return;
    
    setBooking(true);
    try {
      const response = await axios.post('/tokens', { queueId: id });
      if (response.data.success) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to book token');
    } finally {
      setBooking(false);
    }
  };

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
      <div className="max-w-4xl mx-auto">
        <Link
          to={`/business/${queue.business._id}`}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Business
        </Link>

        {/* Queue Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{queue.name}</h1>
              <p className="text-white/60">{queue.purpose}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-white/50 mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>{queue.business.name}</span>
            </div>
            {queue.business.address?.city && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{queue.business.address.city}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl">
            <span className="text-white/60">Queue ID:</span>
            <span className="font-mono text-primary-400 font-semibold">{queue.queueId}</span>
          </div>
        </motion.div>

        {/* Current Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6 text-center"
        >
          <p className="text-white/60 mb-2">Now Serving</p>
          <motion.p
            key={queue.currentToken}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="token-display"
          >
            #{queue.currentToken}
          </motion.p>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{queue.waitingCount}</p>
              <p className="text-white/50 text-sm">People Waiting</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{queue.estimatedWaitMinutes}m</p>
              <p className="text-white/50 text-sm">Est. Wait Time</p>
            </div>
          </div>
        </motion.div>

        {/* Waiting List */}
        {queue.waitingTokens?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card mb-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Up Next
            </h3>
            <div className="space-y-2">
              {queue.waitingTokens.map((token, index) => (
                <div
                  key={token._id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-sm font-semibold text-primary-400">
                      {index + 1}
                    </span>
                    <span className="text-white font-medium">#{token.tokenNumber}</span>
                  </div>
                  <span className={`badge ${
                    token.status === 'checked-in' ? 'badge-success' : 'badge-warning'
                  }`}>
                    {token.status === 'checked-in' ? 'Checked In' : 'Waiting'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Book Token */}
        {user && queue.status === 'active' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={handleBookToken}
              disabled={booking}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2"
            >
              {booking ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Book Token
                </>
              )}
            </button>
          </motion.div>
        )}

        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <Link
              to="/login"
              className="btn-primary inline-flex items-center gap-2"
            >
              Login to Book Token
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QueueDetail;
