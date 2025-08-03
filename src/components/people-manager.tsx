import React, { useState } from 'react';
import { Plus, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface Person {
  id: string;
  name: string;
  color: string;
}

interface PeopleManagerProps {
  people: Person[];
  onPeopleChange: (people: Person[]) => void;
}

const PERSON_COLORS = [
  'hsl(25 95% 53%)',
  'hsl(200 95% 53%)', 
  'hsl(150 95% 43%)',
  'hsl(280 95% 53%)',
  'hsl(45 95% 53%)',
  'hsl(10 95% 53%)',
  'hsl(190 95% 53%)',
  'hsl(120 95% 43%)',
];

export const PeopleManager = ({ people, onPeopleChange }: PeopleManagerProps) => {
  const [newPersonName, setNewPersonName] = useState('');

  const addPerson = () => {
    if (!newPersonName.trim()) return;
    
    const newPerson: Person = {
      id: Date.now().toString(),
      name: newPersonName.trim(),
      color: PERSON_COLORS[people.length % PERSON_COLORS.length]
    };
    
    onPeopleChange([...people, newPerson]);
    setNewPersonName('');
  };

  const removePerson = (id: string) => {
    onPeopleChange(people.filter(p => p.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPerson();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Who's dining?</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Enter person's name"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={addPerson} disabled={!newPersonName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {people.length > 0 && (
          <div className="space-y-2">
            {people.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: person.color }}
                  />
                  <span className="font-medium">{person.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePerson(person.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {people.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Add people to start splitting the bill
          </p>
        )}
      </div>
    </Card>
  );
};