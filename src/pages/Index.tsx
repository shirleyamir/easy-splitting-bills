import React, { useState } from 'react';
import { UploadZone } from '@/components/ui/upload-zone';
import { PeopleManager } from '@/components/people-manager';
import { ItemAssignment } from '@/components/item-assignment';
import { BillSummary } from '@/components/bill-summary';
import { StepIndicator } from '@/components/step-indicator';
import { Button } from '@/components/ui/button';
import { Receipt, Users, Calculator, Share } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-image.jpg';

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

const STEPS = [
  { title: 'Upload', description: 'Upload receipt image' },
  { title: 'People', description: 'Add people' },
  { title: 'Assign', description: 'Assign items' },
  { title: 'Calculate', description: 'View results' },
];

// Mock data for demonstration
const MOCK_ITEMS: ReceiptItem[] = [
  { id: '1', name: 'Caesar Salad', price: 12.99, assignedTo: [] },
  { id: '2', name: 'Margherita Pizza', price: 16.50, assignedTo: [] },
  { id: '3', name: 'Grilled Salmon', price: 24.99, assignedTo: [] },
  { id: '4', name: 'Craft Beer', price: 6.99, assignedTo: [] },
  { id: '5', name: 'Tiramisu', price: 8.99, assignedTo: [] },
];

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [items, setItems] = useState<ReceiptItem[]>([]);

  const handleFileUpload = async (file: File | null) => {
    setUploadedFile(file);
    if (file) {
      try {
        // Convert file to base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = reader.result as string;
          
          // Call Supabase edge function to process receipt
          const { data, error } = await supabase.functions.invoke('process-receipt', {
            body: { imageData: base64Data }
          });

          if (error) {
            console.error('Error processing receipt:', error);
            setItems([]);
          } else {
            setItems(data.items || []);
          }
          
          setCurrentStep(1);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error uploading file:', error);
        setItems([]);
        setCurrentStep(1);
      }
    } else {
      setItems([]);
      setCurrentStep(0);
    }
  };

  const canProceedToAssignment = people.length > 0 && items.length > 0;
  const canViewResults = items.some(item => item.assignedTo.length > 0);

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-90" />
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-4">
            Split Bills Made Simple
          </h1>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Upload your receipt, add your friends, and let AI handle the math. 
            Fair splitting has never been easier.
          </p>
          <div className="flex justify-center gap-6 text-primary-foreground/80">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              <span className="text-sm">Smart Receipt Parsing</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="text-sm">Easy People Management</span>
            </div>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              <span className="text-sm">Instant Calculations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Step Indicator */}
          <StepIndicator steps={STEPS} currentStep={currentStep} className="mb-12" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Step 1: Upload Receipt */}
              <UploadZone 
                onFileUpload={handleFileUpload}
                uploadedFile={uploadedFile}
              />

              {/* Step 2: Add People */}
              {currentStep >= 1 && (
                <PeopleManager 
                  people={people}
                  onPeopleChange={setPeople}
                />
              )}

              {/* Navigation */}
              {currentStep >= 1 && (
                <div className="flex gap-3">
                  {canProceedToAssignment && currentStep < 2 && (
                    <Button 
                      onClick={() => setCurrentStep(2)}
                      className="flex-1"
                    >
                      Assign Items
                    </Button>
                  )}
                  {canViewResults && currentStep < 3 && (
                    <Button 
                      onClick={() => setCurrentStep(3)}
                      variant="outline"
                      className="flex-1"
                    >
                      View Results
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Step 3: Assign Items */}
              {currentStep >= 2 && (
                <ItemAssignment 
                  items={items}
                  people={people}
                  onItemsChange={setItems}
                />
              )}

              {/* Step 4: Bill Summary */}
              {currentStep >= 3 && (
                <BillSummary 
                  items={items}
                  people={people}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
