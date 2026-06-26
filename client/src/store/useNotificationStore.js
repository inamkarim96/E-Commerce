import { create } from 'zustand';

const useNotificationStore = create((set) => ({
  newOrdersCount: 0,
  incrementNewOrders: () => set((state) => ({ newOrdersCount: state.newOrdersCount + 1 })),
  clearNewOrders: () => set({ newOrdersCount: 0 }),
}));

export default useNotificationStore;
