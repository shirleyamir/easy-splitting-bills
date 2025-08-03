import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt, DollarSign } from 'lucide-react';

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

interface ItemAssignmentProps {
  items: ReceiptItem[];
  people: Person[];
  onItemsChange: (items: ReceiptItem[]) => void;
}

export const ItemAssignment = ({ items, people, onItemsChange }: ItemAssignmentProps) => {
  const togglePersonAssignment = (itemId: string, personId: string) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const isAssigned = item.assignedTo.includes(personId);
        return {
          ...item,
          assignedTo: isAssigned
            ? item.assignedTo.filter(id => id !== personId)
            : [...item.assignedTo, personId]
        };
      }
      return item;
    });
    onItemsChange(updatedItems);
  };

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No items detected</h3>
        <p className="text-muted-foreground">
          Upload a receipt to see items automatically extracted
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Receipt className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Assign items to people</h3>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium">{item.name}</h4>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  {item.price.toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {people.map((person) => {
                const isAssigned = item.assignedTo.includes(person.id);
                return (
                  <Button
                    key={person.id}
                    variant={isAssigned ? "default" : "outline"}
                    size="sm"
                    onClick={() => togglePersonAssignment(item.id, person.id)}
                    className="text-xs"
                    style={isAssigned ? { 
                      backgroundColor: person.color,
                      borderColor: person.color
                    } : {}}
                  >
                    {person.name}
                  </Button>
                );
              })}
            </div>
            
            {item.assignedTo.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                No one assigned to this item
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};