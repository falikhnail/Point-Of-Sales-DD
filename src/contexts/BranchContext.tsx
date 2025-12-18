import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Branch, BranchContext as IBranchContext } from '@/types/branch';
import { getFromStorage, setToStorage } from '@/lib/storage';

const STORAGE_KEY = 'dimsum_branches';
const CURRENT_BRANCH_KEY = 'dimsum_current_branch';

const defaultBranches: Branch[] = [
  {
    id: 'branch-1',
    name: 'Cabang Pusat',
    code: 'PST',
    address: 'Jl. Raya Utama No. 123, Jakarta',
    phone: '021-12345678',
    email: 'pusat@dimsummpokrani.com',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const BranchContext = createContext<IBranchContext | undefined>(undefined);

export const BranchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranchState] = useState<Branch | null>(null);

  useEffect(() => {
    // Initialize branches
    const storedBranches = getFromStorage<Branch[]>(STORAGE_KEY, []);
    if (storedBranches.length === 0) {
      setToStorage(STORAGE_KEY, defaultBranches);
      setBranches(defaultBranches);
    } else {
      setBranches(storedBranches);
    }

    // Initialize current branch
    const storedCurrentBranch = getFromStorage<Branch | null>(CURRENT_BRANCH_KEY, null);
    if (storedCurrentBranch) {
      setCurrentBranchState(storedCurrentBranch);
    } else if (storedBranches.length > 0) {
      const firstBranch = storedBranches[0];
      setCurrentBranchState(firstBranch);
      setToStorage(CURRENT_BRANCH_KEY, firstBranch);
    } else if (defaultBranches.length > 0) {
      setCurrentBranchState(defaultBranches[0]);
      setToStorage(CURRENT_BRANCH_KEY, defaultBranches[0]);
    }
  }, []);

  const setCurrentBranch = (branch: Branch) => {
    setCurrentBranchState(branch);
    setToStorage(CURRENT_BRANCH_KEY, branch);
  };

  const addBranch = (branch: Branch) => {
    const updatedBranches = [...branches, branch];
    setBranches(updatedBranches);
    setToStorage(STORAGE_KEY, updatedBranches);
  };

  const updateBranch = (id: string, updatedData: Partial<Branch>) => {
    const updatedBranches = branches.map((branch) =>
      branch.id === id ? { ...branch, ...updatedData } : branch
    );
    setBranches(updatedBranches);
    setToStorage(STORAGE_KEY, updatedBranches);

    // Update current branch if it's the one being updated
    if (currentBranch?.id === id) {
      const updated = { ...currentBranch, ...updatedData };
      setCurrentBranchState(updated);
      setToStorage(CURRENT_BRANCH_KEY, updated);
    }
  };

  const deleteBranch = (id: string) => {
    const updatedBranches = branches.filter((branch) => branch.id !== id);
    setBranches(updatedBranches);
    setToStorage(STORAGE_KEY, updatedBranches);

    // If current branch is deleted, switch to first available branch
    if (currentBranch?.id === id && updatedBranches.length > 0) {
      setCurrentBranch(updatedBranches[0]);
    }
  };

  const switchBranch = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    if (branch) {
      setCurrentBranch(branch);
    }
  };

  return (
    <BranchContext.Provider
      value={{
        currentBranch,
        branches,
        setCurrentBranch,
        addBranch,
        updateBranch,
        deleteBranch,
        switchBranch,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};