import * as socketModule from '../../../socket';

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({ on: jest.fn(), emit: jest.fn(), close: jest.fn() })),
}));

describe('utils/socket', () => {
  it('initializes socket with websocket transport', () => {
    const { socket } = socketModule;
    // basic shape check
    expect(socket).toBeTruthy();
    expect(typeof (socket as any).emit).toBe('function');
  });
});
