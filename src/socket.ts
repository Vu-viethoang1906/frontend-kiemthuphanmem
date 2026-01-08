// src/socket.ts
import { io } from 'socket.io-client';

const getSocketUrl = () => {
  try {
    return process.env.REACT_APP_SOCKET || window.location.origin;
  } catch (e) {
    return process.env.REACT_APP_SOCKET || undefined;
  }
};

export const socket = io(getSocketUrl(), {
  withCredentials: true,
  transports: ['websocket'], // avoid polling where possible
});
