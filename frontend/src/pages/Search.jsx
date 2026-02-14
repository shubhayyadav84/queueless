import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Phone, Clock, ArrowRight, Building2, Hash } from 'lucide-react';
import axios from 'axios';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [queueId, setQueueId] = useState('');
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('business');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async (query = '') => {
    setLoading(true);
    try {
      const response = await axios.get(`/businesses?search=${query}`);
      setBusinesses(response.data.businesses);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBusinesses(searchQuery);
  };

  const handleQueueIdSearch = async (e) => {
    e.preventDefault();
    if (!queueId.trim()) return;
    
    try {
      const response = await axios.get(`/queues/search?queueId=${queueId.toUpperCase()}`);
      if (response.data.success) {
        navigate(`/queue/${response.data.queue._id}`);
      }
    } catch (error) {
      console.error('Queue not found:', error);
    }
  };

  const categories = [
    { id: '', name: 'All', icon: '🌐' },
    { id: 'clinic', name: 'Clinics', icon: '🏥' },
    { id: 'salon', name: 'Salons', icon: '💇' },
    { id: 'bank', name: 'Banks', icon: '🏦' },
    { id: 'restaurant', name: 'Restaurants', icon: '🍽️' },
    { id: 'government', name: 'Government', icon: '🏛️' },
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
            Find Your Queue
          </h1>
          <p className="text-white/60">
            Search for businesses or enter a Queue ID directly
          </p>
        </motion.div>

        {/* Search Mode Toggle */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setSearchMode('business')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
              searchMode === 'business'
                ? 'bg-primary-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Building2 className="w-5 h-5" />
            Search Business
          </button>
          <button
            onClick={() => setSearchMode('queueId')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
              searchMode === 'queueId'
                ? 'bg-primary-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Hash className="w-5 h-5" />
            Enter Queue ID
          </button>
        </div>

        {/* Search Forms */}
        <AnimatePresence mode="wait">
          {searchMode === 'business' ? (
            <motion.form
              key="business"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSearch}
              className="max-w-2xl mx-auto mb-12"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search businesses, clinics, salons..."
                  className="input-field pl-12 pr-32 py-4"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-2 px-4"
                >
                  Search
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="queueId"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleQueueIdSearch}
              className="max-w-2xl mx-auto mb-12"
            >
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={queueId}
                  onChange={(e) => setQueueId(e.target.value.toUpperCase())}
                  placeholder="Enter Queue ID (e.g., QABC123)"
                  className="input-field pl-12 pr-32 py-4 uppercase"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-2 px-4"
                >
                  Find
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Categories */}
        {searchMode === 'business' && (
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => fetchBusinesses(cat.id ? `category:${cat.id}` : '')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                <span>{cat.icon}</span>
                <span className="text-sm">{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {searchMode === 'business' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="spinner w-8 h-8" />
              </div>
            ) : businesses.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No businesses found</p>
              </div>
            ) : (
              businesses.map((business, index) => (
                <motion.div
                  key={business._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/business/${business._id}`)}
                  className="card cursor-pointer hover:border-primary-500/30 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xl">
                      {business.category === 'clinic' && '🏥'}
                      {business.category === 'salon' && '💇'}
                      {business.category === 'bank' && '🏦'}
                      {business.category === 'restaurant' && '🍽️'}
                      {business.category === 'government' && '🏛️'}
                      {!['clinic', 'salon', 'bank', 'restaurant', 'government'].includes(business.category) && '🏢'}
                    </div>
                    <span className="badge-primary capitalize">
                      {business.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                    {business.name}
                  </h3>
                  
                  {business.description && (
                    <p className="text-white/60 text-sm mb-4 line-clamp-2">
                      {business.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-white/50">
                    {business.address?.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{business.address.city}</span>
                      </div>
                    )}
                    {business.contact?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{business.contact.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Clock className="w-4 h-4" />
                      <span>View Queues</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-primary-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
