import React from 'react';
import { Card } from '@/components/ui/card';
import { Calculator } from 'lucide-react';
import { formatCurrency } from '@/components/currency-selector';

interface Person {
  id: string;
  name: string;
  color: string;
}

interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  assignedTo: string[];
}

interface BillSummaryProps {
  items: ReceiptItem[];
  people: Person[];
  currency?: string;
}

export const BillSummary = ({ items, people, currency = 'IDR' }: BillSummaryProps) => {
  const calculatePersonTotal = (personId: string) => {
    return items.reduce((total, item) => {
      if (item.assignedTo.includes(personId)) {
        const splitAmount = item.price / item.assignedTo.length;
        return total + splitAmount;
      }
      return total;
    }, 0);
  };

  const totalBill = items.reduce((sum, item) => sum + item.price, 0);
  const assignedAmount = items.reduce((sum, item) => {
    return item.assignedTo.length > 0 ? sum + item.price : sum;
  }, 0);
  const unassignedAmount = totalBill - assignedAmount;

  if (people.length === 0 || items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Ready to calculate</h3>
        <p className="text-muted-foreground">
          Add people and assign items to see the bill breakdown
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Bill Summary</h3>
      </div>

      {/* Individual totals */}
      <div className="space-y-3 mb-6">
        {people.map((person) => {
          const total = calculatePersonTotal(person.id);
          return (
            <div key={person.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: person.color }}
                />
                <span className="font-medium">{person.name}</span>
              </div>
              <div className="font-bold">
                {formatCurrency(total, currency)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals breakdown */}
      <div className="border-t pt-4 space-y-2">
         <div className="flex justify-between text-sm">
           <span className="text-muted-foreground">Total bill</span>
           <span>{formatCurrency(totalBill, currency)}</span>
         </div>
         <div className="flex justify-between text-sm">
           <span className="text-muted-foreground">Assigned</span>
           <span>{formatCurrency(assignedAmount, currency)}</span>
         </div>
         {unassignedAmount > 0 && (
           <div className="flex justify-between text-sm text-orange-600">
             <span>Unassigned</span>
             <span>{formatCurrency(unassignedAmount, currency)}</span>
           </div>
         )}
         <div className="flex justify-between font-bold text-lg pt-2 border-t">
           <span>Split total</span>
           <span>{formatCurrency(assignedAmount, currency)}</span>
         </div>
      </div>
    </Card>
  );
};