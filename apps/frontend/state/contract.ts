import { create } from "zustand";
import { createSelectorHooks } from "auto-zustand-selectors-hook";

type ContractStore = {
  origin: number;
  destination: number;
  feed: string;
  gelatoTaskId: string;

  setOrigin: (chainId: number) => void;
  setDestination: (chainId: number) => void;
  setFeed: (feed: string) => void;
  setGelatoTaskId: (gelatoTaskId: string) => void;
};

const contractStore = create<ContractStore>()((set) => ({
  origin: 5,
  destination: 80001,
  feed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
  gelatoTaskId: "",

  setOrigin: (origin) => set((state) => ({ ...state, origin })),
  setDestination: (destination) => set((state) => ({ ...state, destination })),
  setFeed: (feed) => set((state) => ({ ...state, feed })),
  setGelatoTaskId: (gelatoTaskId) =>
    set((state) => ({ ...state, gelatoTaskId })),
}));

export const useContractStore = createSelectorHooks(contractStore);
