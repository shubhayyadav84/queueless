import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Building2, Users, Clock, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ businesses: 0, queues: 0, tokens: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/businesses?limit=1');
      setStats(prev => ({ ...prev, businesses: response.data.total || 0 }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const features = [
    {
      icon: Clock,
      title: 'Real-time Updates',
      description: 'Live queue status with instant notifications'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'OTP-based authentication with role-based access'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Book tokens in seconds, skip the wait'
    }
  ];

  const categories = [
    { name: 'Clinics', icon: '🏥', color: 'from-blue-500 to-cyan-500' },
    { name: 'Salons', icon: '💇', color: 'from-pink-500 to-rose-500' },
    { name: 'Banks', icon: '🏦', color: 'from-green-500 to-emerald-500' },
    { name: 'Restaurants', icon: '🍽️', color: 'from-orange-500 to-amber-500' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/20 border border-primary-500/30 mb-8">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-primary-400">Now Serving Smarter Queues</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">QueueLess</span>
              <br />
              <span className="text-white">Digital Queue System</span>
            </h1>
            
            <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
              Universal digital queue and appointment management system for clinics, salons, banks, 
              government offices, and any service business.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/search"
                className="btn-primary flex items-center gap-2 text-lg px-8 py-4"
              >
                <Search className="w-5 h-5" />
                Find a Queue
              </Link>
              
              {!user && (
                <Link
                  to="/login"
                  className="btn-secondary flex items-center gap-2 text-lg px-8 py-4"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Active Businesses', value: stats.businesses, icon: Building2 },
              { label: 'Queues Managed', value: '∞', icon: Clock },
              { label: 'Happy Users', value: '∞', icon: Users },
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
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="gradient-text">Categories</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="card text-center cursor-pointer hover:scale-105 transition-transform"
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center text-3xl`}>
                  {category.icon}
                </div>
                <h3 className="text-lg font-semibold text-white">{category.name}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            <span className="gradient-text">Why QueueLess?</span>
          </h2>
          <p className="text-center text-white/60 mb-12 max-w-2xl mx-auto">
            Experience the future of queue management with our cutting-edge features
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="card text-center py-16 px-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-500/10" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to eliminate queues?
              </h2>
              <p className="text-white/60 mb-8 max-w-xl mx-auto">
                Join thousands of businesses and users who have transformed their queue experience
              </p>
              <Link
                to={user ? '/search' : '/login'}
                className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
              >
                {user ? 'Find a Queue' : 'Get Started Free'}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
