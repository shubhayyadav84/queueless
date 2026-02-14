import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinQueue = (queueId) => {
    if (socket) {
      socket.emit('joinQueue', queueId);
    }
  };

  const leaveQueue = (queueId) => {
    if (socket) {
      socket.emit('leaveQueue', queueId);
    }
  };

  const subscribeToToken = (tokenId) => {
    if (socket) {
      socket.emit('subscribeToToken', tokenId);
    }
  };

  const unsubscribeFromToken = (tokenId) => {
    if (socket) {
      socket.emit('unsubscribeFromToken', tokenId);
    }
  };

  const value = {
    socket,
    connected,
    joinQueue,
    leaveQueue,
    subscribeToToken,
    unsubscribeFromToken
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
