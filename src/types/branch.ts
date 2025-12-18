export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  managerId?: string;
  managerName?: string;
}

export interface BranchContext {
  currentBranch: Branch | null;
  branches: Branch[];
  setCurrentBranch: (branch: Branch) => void;
  addBranch: (branch: Branch) => void;
  updateBranch: (id: string, branch: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;
  switchBranch: (branchId: string) => void;
}