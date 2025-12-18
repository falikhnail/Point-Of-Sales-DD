import { useBranch } from '@/contexts/BranchContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Store } from 'lucide-react';

export default function BranchSelector() {
  const { currentBranch, branches, switchBranch } = useBranch();

  const activeBranches = branches.filter((b) => b.isActive);

  if (activeBranches.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Store className="h-4 w-4 text-muted-foreground" />
      <Select
        value={currentBranch?.id || ''}
        onValueChange={(value) => switchBranch(value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Pilih Cabang" />
        </SelectTrigger>
        <SelectContent>
          {activeBranches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name} ({branch.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}