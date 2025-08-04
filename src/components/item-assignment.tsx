import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Receipt, DollarSign, Plus, Edit2, Trash2, Brain } from 'lucide-react';
import { formatCurrency } from '@/components/currency-selector';
import { supabase } from '@/integrations/supabase/client';

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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReceiptItem | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const addNewItem = () => {
    if (!newItemName.trim() || !newItemPrice.trim()) return;
    
    const newItem: ReceiptItem = {
      id: `manual_${Date.now()}`,
      name: newItemName.trim(),
      price: parseFloat(newItemPrice),
      assignedTo: []
    };
    
    onItemsChange([...items, newItem]);
    setNewItemName('');
    setNewItemPrice('');
    setIsAddDialogOpen(false);
  };

  const updateItem = (itemId: string, name: string, price: number) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, name, price } : item
    );
    onItemsChange(updatedItems);
    setEditingItem(null);
  };

  const deleteItem = (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    onItemsChange(updatedItems);
  };

  const analyzeItemPrices = async () => {
    if (items.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-item-prices', {
        body: { items }
      });

      if (error) throw error;
      setAiAnalysis(data.analysis);
    } catch (error) {
      console.error('Error analyzing item prices:', error);
    } finally {
      setIsAnalyzing(false);
    }
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Assign items to people</h3>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={analyzeItemPrices}
            disabled={isAnalyzing || items.length === 0}
          >
            <Brain className="h-4 w-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Item Name</label>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Enter item name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Price (IDR)</label>
                <Input
                  type="number"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  placeholder="Enter price"
                />
              </div>
              <Button onClick={addNewItem} className="w-full">
                Add Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {aiAnalysis && (
        <Card className="p-4 mb-4 bg-muted/50">
          <div className="flex items-start gap-2">
            <Brain className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium mb-2">AI Price Analysis</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiAnalysis}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                {editingItem?.id === item.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                      className="font-medium"
                    />
                    <Input
                      type="number"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value) || 0})}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => updateItem(item.id, editingItem.name, editingItem.price)}
                      >
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingItem(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="font-medium">{item.name}</h4>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(item.price, 'IDR')}
                    </div>
                  </>
                )}
              </div>
              {editingItem?.id !== item.id && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingItem(item)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
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