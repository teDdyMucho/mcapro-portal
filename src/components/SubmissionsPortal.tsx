import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import ApplicationForm from './ApplicationForm';
import LenderMatches from './LenderMatches';
import SubmissionRecap from './SubmissionRecap';

// Broad application data type to interop with both LenderMatches and SubmissionRecap
type AppData = {
  id: string;
  businessName: string;
  monthlyRevenue: number;
  timeInBusiness: number;
  creditScore: number;
  industry: string;
  requestedAmount: number;
  status?: 'draft' | 'submitted' | 'under-review' | 'approved' | 'matched';
  // Top-level fields expected by LenderMatches
  ownerName: string;
  email: string;
  phone?: string;
  address?: string;
  ein?: string;
  businessType?: string;
  yearsInBusiness?: number;
  numberOfEmployees?: number;
  annualRevenue?: number;
  monthlyDeposits?: number;
  existingDebt?: number;
  documents: string[];
  // Nested fields expected by SubmissionRecap
  contactInfo: {
    ownerName: string;
    email: string;
    phone: string;
    address: string;
  };
  businessInfo: {
    ein: string;
    businessType: string;
    yearsInBusiness: number;
    numberOfEmployees: number;
  };
  financialInfo: {
    annualRevenue: number;
    averageMonthlyRevenue: number;
    averageMonthlyDeposits: number;
    existingDebt: number;
  };
};

// Local type mirroring ApplicationForm's Application output
type FormApplication = {
  id: string;
  businessName: string;
  monthlyRevenue: number;
  timeInBusiness: number;
  creditScore: number;
  industry: string;
  requestedAmount: number;
  status: 'draft' | 'submitted' | 'under-review' | 'approved' | 'matched';
  contactInfo: {
    ownerName: string;
    email: string;
    phone: string;
    address: string;
  };
  businessInfo: {
    ein: string;
    businessType: string;
    yearsInBusiness: number;
    numberOfEmployees: number;
  };
  financialInfo: {
    annualRevenue: number;
    averageMonthlyRevenue: number;
    averageMonthlyDeposits: number;
    existingDebt: number;
  };
  documents: string[];
};

const SubmissionsPortal: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'application' | 'matches' | 'recap'>('application');
  const [application, setApplication] = useState<AppData | null>(null);
  const [selectedLenders, setSelectedLenders] = useState<string[]>([]);

  const handleApplicationSubmit = (appData: FormApplication) => {
    // Map to unified AppData with both nested and top-level fields
    const mapped: AppData = {
      id: appData.id,
      businessName: appData.businessName,
      monthlyRevenue: appData.monthlyRevenue,
      timeInBusiness: appData.timeInBusiness,
      creditScore: appData.creditScore,
      industry: appData.industry,
      requestedAmount: appData.requestedAmount,
      status: appData.status,
      // top-level duplicates for LenderMatches
      ownerName: appData.contactInfo.ownerName,
      email: appData.contactInfo.email,
      phone: appData.contactInfo.phone,
      address: appData.contactInfo.address,
      ein: appData.businessInfo.ein,
      businessType: appData.businessInfo.businessType,
      yearsInBusiness: appData.businessInfo.yearsInBusiness,
      numberOfEmployees: appData.businessInfo.numberOfEmployees,
      annualRevenue: appData.financialInfo.annualRevenue,
      monthlyDeposits: appData.financialInfo.averageMonthlyDeposits,
      existingDebt: appData.financialInfo.existingDebt,
      documents: appData.documents,
      // nested for SubmissionRecap
      contactInfo: appData.contactInfo,
      businessInfo: appData.businessInfo,
      financialInfo: appData.financialInfo,
    };
    setApplication(mapped);
    setCurrentStep('matches');
  };

  const handleLendersSelected = (lenderIds: string[]) => {
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
        />
      ) : (
        <SubmissionRecap 
          application={application ? {
            ...application,
            status: (['draft','submitted','under-review','matched'].includes(String(application.status))
              ? (application.status as 'draft' | 'submitted' | 'under-review' | 'matched')
              : 'submitted')
          } : null}
          selectedLenderIds={selectedLenders}
          onBack={handleBackToMatches}
          onSubmit={handleFinalSubmit}
        />
      )}
    </div>
  );
};

export default SubmissionsPortal;