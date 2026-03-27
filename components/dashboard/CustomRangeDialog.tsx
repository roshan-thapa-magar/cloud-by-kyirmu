import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CustomRangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onApply: (start: string, end: string) => void;
}

export function CustomRangeDialog({
  open,
  onOpenChange,
  dateRange,
  onDateRangeChange,
  onApply,
}: CustomRangeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Custom Range</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
          />
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onApply(dateRange.start, dateRange.end)}
            disabled={!dateRange.start || !dateRange.end}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}