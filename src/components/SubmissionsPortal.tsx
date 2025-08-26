import React, { useState } from 'react';
import { Upload, FileText, DollarSign, Building2, Calendar, Phone, Mail, MapPin, User, CheckCircle, AlertCircle } from 'lucide-react';
import ApplicationForm from './ApplicationForm';
import LenderMatches from './LenderMatches';
import SubmissionRecap from './SubmissionRecap';

interface Application {
  id: string;
  businessName: string;
  monthlyRevenue: number;
  timeInBusiness: number;
  creditScore: number;
  industry: string;
  requestedAmount: number;
  status: 'draft' | 'submitted' | 'under-review' | 'approved';
}

const SubmissionsPortal: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'application' | 'matches' | 'recap'>('application');
  const [application, setApplication] = useState<Application | null>(null);
  const [selectedLenders, setSelectedLenders] = useState<string[]>([]);

  const handleApplicationSubmit = (appData: Application) => {
    setApplication(appData);
    setCurrentStep('matches');
  };

  const handleLendersSelected = (lenderIds: string[], lenders: any[]) => {
    setSelectedLenders(lenderIds);
    setCurrentStep('recap');
  };

  const handleBackToMatches = () => {
    setCurrentStep('matches');
  };

  const handleFinalSubmit = () => {
    // This will be handled by the recap component
    console.log('Final submission completed');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Submissions Portal</h1>
        <p className="text-gray-600">Submit your merchant cash advance application and get matched with qualified lenders</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex items-center ${currentStep === 'application' ? 'text-blue-600' : application ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              application ? 'bg-green-100 text-green-600' : currentStep === 'application' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {application ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <span className="ml-2 text-sm font-medium">Document Upload & Application</span>
          </div>
          
          <div className={`flex-1 h-1 mx-4 ${application ? 'bg-green-200' : 'bg-gray-200'}`}></div>
          
          <div className={`flex items-center ${currentStep === 'matches' ? 'text-blue-600' : selectedLenders.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              selectedLenders.length > 0 ? 'bg-green-100 text-green-600' : currentStep === 'matches' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {selectedLenders.length > 0 ? <CheckCircle className="w-5 h-5" /> : '2'}
            </div>
            <span className="ml-2 text-sm font-medium">Lender Matches</span>
          </div>
          
          <div className={`flex-1 h-1 mx-4 ${selectedLenders.length > 0 ? 'bg-green-200' : 'bg-gray-200'}`}></div>
          
          <div className={`flex items-center ${currentStep === 'recap' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'recap' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Submission Recap</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {currentStep === 'application' ? (
        <ApplicationForm onSubmit={handleApplicationSubmit} />
      ) : currentStep === 'matches' ? (
        <LenderMatches 
          application={application} 
          onBack={() => setCurrentStep('application')} 
          onLenderSelect={handleLendersSelected}
          isAdmin={false} 
        />
      ) : (
        <SubmissionRecap 
          application={application}
          selectedLenderIds={selectedLenders}
          onBack={handleBackToMatches}
          onSubmit={handleFinalSubmit}
        />
      )}
    </div>
  );
};

export default SubmissionsPortal;