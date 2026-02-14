import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, ArrowLeft, Users, Plus, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BusinessDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingQueue, setBookingQueue] = useState(null);

  useEffect(() => {
    fetchBusiness();
  }, [id]);

  const fetchBusiness = async () => {
    try {
      const response = await axios.get(`/businesses/${id}`);
      setBusiness(response.data.business);
    } catch (error) {
      console.error('Error fetching business:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookToken = async (queueId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setBookingQueue(queueId);
    try {
      const response = await axios.post('/tokens', { queueId });
      if (response.data.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error booking token:', error);
      alert(error.response?.data?.message || 'Failed to book token');
    } finally {
      setBookingQueue(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60">Business not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Business Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-4xl">
              {business.category === 'clinic' && '🏥'}
              {business.category === 'salon' && '💇'}
              {business.category === 'bank' && '🏦'}
              {business.category === 'restaurant' && '🍽️'}
              {business.category === 'government' && '🏛️'}
              {!['clinic', 'salon', 'bank', 'restaurant', 'government'].includes(business.category) && '🏢'}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">{business.name}</h1>
                <span className="badge-primary capitalize">{business.category}</span>
              </div>
              
              {business.description && (
                <p className="text-white/60 mb-4">{business.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-white/50">
                {business.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {business.address.street && `${business.address.street}, `}
                      {business.address.city}
                    </span>
                  </div>
                )}
                {business.contact?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{business.contact.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Queues Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">
            Available <span className="gradient-text">Queues</span>
          </h2>

          {business.queues?.length === 0 ? (
            <div className="card text-center py-12">
              <Clock className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No active queues available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {business.queues?.map((queue, index) => (
                <motion.div
                  key={queue._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{queue.name}</h3>
                      <p className="text-white/60 text-sm">{queue.purpose}</p>
                    </div>
                    <span className={`badge ${
                      queue.status === 'active' ? 'badge-success' : 
                      queue.status === 'paused' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {queue.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold gradient-text">{queue.currentToken}</p>
                      <p className="text-white/50 text-sm">Now Serving</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-white">{queue.waitingCount || 0}</p>
                      <p className="text-white/50 text-sm">Waiting</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4 text-sm text-white/50">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Type: {queue.type === 'virtual' ? 'Virtual Queue' : 'Appointment'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Queue ID: {queue.queueId}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBookToken(queue._id)}
                    disabled={queue.status !== 'active' || bookingQueue === queue._id}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                      queue.status === 'active'
                        ? 'btn-primary'
                        : 'bg-white/5 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    {bookingQueue === queue._id ? (
                      <div className="spinner w-5 h-5" />
                    ) : queue.status === 'active' ? (
                      <>
                        <Plus className="w-5 h-5" />
                        Book Token
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Queue {queue.status}
                      </>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
