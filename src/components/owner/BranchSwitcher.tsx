import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOwnerOrganizations, ALL_BRANCHES } from '@/hooks/useOwnerOrganizations';
import { Building2 } from 'lucide-react';

interface Props {
  value: string;
  onChange: (id: string) => void;
  showAll?: boolean;
}

export default function BranchSwitcher({ value, onChange, showAll = true }: Props) {
  const { data: orgs } = useOwnerOrganizations();

  if (!orgs || orgs.length <= 1) return null;

  return (
    <Select value={value || (showAll ? ALL_BRANCHES : orgs[0]?.id)} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-[140px] text-xs">
        <Building2 className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {showAll && <SelectItem value={ALL_BRANCHES}>All branches</SelectItem>}
        {orgs.map(org => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
