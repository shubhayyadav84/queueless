import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Clock, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';

const StaffDashboard = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await axios.get('/businesses/staff-businesses');
      setBusinesses(response.data.businesses);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text">Staff Dashboard</h1>
          <p className="text-white/60">Manage queues for your assigned businesses</p>
        </div>

        {businesses.length === 0 ? (
          <div className="card text-center py-16">
            <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Businesses Assigned</h3>
            <p className="text-white/60">You haven't been assigned to any business yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {businesses.map((item, index) => (
              <motion.div
                key={item.business._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-2xl">
                    {item.business.category === 'clinic' && '🏥'}
                    {item.business.category === 'salon' && '💇'}
                    {item.business.category === 'bank' && '🏦'}
                    {item.business.category === 'restaurant' && '🍽️'}
                    {!['clinic', 'salon', 'bank', 'restaurant'].includes(item.business.category) && '🏢'}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{item.business.name}</h3>
                    <p className="text-white/60 capitalize">{item.business.category}</p>
                    <p className="text-white/40 text-sm">
                      Assigned on {new Date(item.assignedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/business/${item.business._id}`}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Clock className="w-5 h-5" />
                  Manage Queues
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
