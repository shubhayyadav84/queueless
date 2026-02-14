import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Building2, Users, Clock, Settings, Trash2, Edit2, CheckCircle, XCircle, Play, Pause, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [activeTab, setActiveTab] = useState('businesses');

  // Form states
  const [businessForm, setBusinessForm] = useState({
    name: '',
    description: '',
    category: 'clinic',
    address: { street: '', city: '', state: '', zipCode: '' },
    contact: { phone: '', email: '' }
  });

  const [queueForm, setQueueForm] = useState({
    name: '',
    purpose: '',
    type: 'virtual',
    settings: { avgServiceTime: 15, maxTokensPerDay: 100 }
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await axios.get('/businesses/my-businesses');
      setBusinesses(response.data.businesses);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/businesses', businessForm);
      setShowCreateModal(false);
      setBusinessForm({
        name: '',
        description: '',
        category: 'clinic',
        address: { street: '', city: '', state: '', zipCode: '' },
        contact: { phone: '', email: '' }
      });
      fetchBusinesses();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create business');
    }
  };

  const handleCreateQueue = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/queues', {
        ...queueForm,
        businessId: selectedBusiness._id
      });
      setShowQueueModal(false);
      setQueueForm({
        name: '',
        purpose: '',
        type: 'virtual',
        settings: { avgServiceTime: 15, maxTokensPerDay: 100 }
      });
      fetchBusinesses();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create queue');
    }
  };

  const handleDeleteBusiness = async (id) => {
    if (!confirm('Are you sure you want to delete this business?')) return;
    try {
      await axios.delete(`/businesses/${id}`);
      fetchBusinesses();
    } catch (error) {
      alert('Failed to delete business');
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
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Owner Dashboard</h1>
            <p className="text-white/60">Manage your businesses and queues</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Register Business
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Businesses', value: businesses.length, icon: Building2 },
            { label: 'Total Queues', value: businesses.reduce((acc, b) => acc + (b.queues?.length || 0), 0), icon: Clock },
            { label: 'Staff Members', value: businesses.reduce((acc, b) => acc + (b.staff?.length || 0), 0), icon: Users },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary-500/20 flex items-center justify-center">
                <stat.icon className="w-7 h-7 text-primary-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-white/60">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Businesses List */}
        {businesses.length === 0 ? (
          <div className="card text-center py-16">
            <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Businesses Yet</h3>
            <p className="text-white/60 mb-6">Register your first business to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Register Business
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {businesses.map((business, index) => (
              <motion.div
                key={business._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-2xl">
                      {business.category === 'clinic' && '🏥'}
                      {business.category === 'salon' && '💇'}
                      {business.category === 'bank' && '🏦'}
                      {business.category === 'restaurant' && '🍽️'}
                      {!['clinic', 'salon', 'bank', 'restaurant'].includes(business.category) && '🏢'}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-semibold text-white">{business.name}</h3>
                        <span className="badge-primary capitalize">{business.category}</span>
                      </div>
                      <p className="text-white/60 text-sm">{business.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedBusiness(business);
                        setShowQueueModal(true);
                      }}
                      className="btn-secondary py-2 px-4 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Queue
                    </button>
                    <button
                      onClick={() => handleDeleteBusiness(business._id)}
                      className="p-2 rounded-xl bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Queues */}
                {business.queues?.length > 0 && (
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-sm font-medium text-white/60 mb-4">Active Queues</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {business.queues.map((queue) => (
                        <QueueCard 
                          key={queue._id} 
                          queue={queue} 
                          businessId={business._id}
                          onUpdate={fetchBusinesses}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Staff */}
                {business.staff?.length > 0 && (
                  <div className="border-t border-white/10 pt-6 mt-6">
                    <h4 className="text-sm font-medium text-white/60 mb-4">Staff Members</h4>
                    <div className="flex flex-wrap gap-2">
                      {business.staff.map((s) => (
                        <div
                          key={s.user._id}
                          className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg"
                        >
                          <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-xs text-primary-400">
                            {s.user.name.charAt(0)}
                          </div>
                          <span className="text-sm text-white">{s.user.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Business Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <Modal onClose={() => setShowCreateModal(false)} title="Register New Business">
              <form onSubmit={handleCreateBusiness} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Category</label>
                  <select
                    value={businessForm.category}
                    onChange={(e) => setBusinessForm({ ...businessForm, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="clinic">Clinic</option>
                    <option value="salon">Salon</option>
                    <option value="bank">Bank</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="government">Government Office</option>
                    <option value="service_center">Service Center</option>
                    <option value="repair_center">Repair Center</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Description</label>
                  <textarea
                    value={businessForm.description}
                    onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                    className="input-field h-24 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">City</label>
                    <input
                      type="text"
                      value={businessForm.address.city}
                      onChange={(e) => setBusinessForm({ 
                        ...businessForm, 
                        address: { ...businessForm.address, city: e.target.value }
                      })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={businessForm.contact.phone}
                      onChange={(e) => setBusinessForm({ 
                        ...businessForm, 
                        contact: { ...businessForm.contact, phone: e.target.value }
                      })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Create Business
                  </button>
                </div>
              </form>
            </Modal>
          )}
        </AnimatePresence>

        {/* Create Queue Modal */}
        <AnimatePresence>
          {showQueueModal && selectedBusiness && (
            <Modal onClose={() => setShowQueueModal(false)} title="Create New Queue">
              <form onSubmit={handleCreateQueue} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Queue Name</label>
                  <input
                    type="text"
                    value={queueForm.name}
                    onChange={(e) => setQueueForm({ ...queueForm, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., General Checkup"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Purpose</label>
                  <input
                    type="text"
                    value={queueForm.purpose}
                    onChange={(e) => setQueueForm({ ...queueForm, purpose: e.target.value })}
                    className="input-field"
                    placeholder="e.g., For general health checkups"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Queue Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['virtual', 'appointment'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setQueueForm({ ...queueForm, type })}
                        className={`py-3 px-4 rounded-xl border transition-all ${
                          queueForm.type === type
                            ? 'bg-primary-500 border-primary-500 text-white'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    Average Service Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={queueForm.settings.avgServiceTime}
                    onChange={(e) => setQueueForm({ 
                      ...queueForm, 
                      settings: { ...queueForm.settings, avgServiceTime: parseInt(e.target.value) }
                    })}
                    className="input-field"
                    min="1"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowQueueModal(false)} className="flex-1 btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Create Queue
                  </button>
                </div>
              </form>
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const QueueCard = ({ queue, businessId, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handlePause = async () => {
    setLoading(true);
    try {
      await axios.post(`/queues/${queue._id}/pause`);
      onUpdate();
    } catch (error) {
      alert('Failed to pause queue');
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    setLoading(true);
    try {
      await axios.post(`/queues/${queue._id}/resume`);
      onUpdate();
    } catch (error) {
      alert('Failed to resume queue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h5 className="font-semibold text-white">{queue.name}</h5>
          <p className="text-white/50 text-sm">{queue.purpose}</p>
        </div>
        <span className={`badge ${
          queue.status === 'active' ? 'badge-success' : 
          queue.status === 'paused' ? 'badge-warning' : 'badge-danger'
        }`}>
          {queue.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-white">{queue.currentToken}</p>
          <p className="text-white/50 text-xs">Current</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-white">{queue.nextToken - 1}</p>
          <p className="text-white/50 text-xs">Last Token</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40 font-mono">{queue.queueId}</span>
        <div className="flex gap-2">
          {queue.status === 'active' ? (
            <button
              onClick={handlePause}
              disabled={loading}
              className="p-2 rounded-lg bg-warning-500/10 text-warning-400 hover:bg-warning-500/20 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
            </button>
          ) : (
            <button
              onClick={handleResume}
              disabled={loading}
              className="p-2 rounded-lg bg-success-500/10 text-success-400 hover:bg-success-500/20 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            </button>
          )}
          <Link
            to={`/queue/${queue._id}/manage`}
            className="p-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-all"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const Modal = ({ children, onClose, title }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="card w-full max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <button onClick={onClose} className="text-white/40 hover:text-white">
          <XCircle className="w-6 h-6" />
        </button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

export default OwnerDashboard;
