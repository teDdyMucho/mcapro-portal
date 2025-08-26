import React, { useState } from 'react';
import { Upload, FileText, DollarSign, Building2, Calendar, Phone, Mail, MapPin, User, CheckCircle, AlertCircle, FileCheck, Loader } from 'lucide-react';
import { createApplication, Application as DBApplication } from '../lib/supabase';
import { extractDataFromPDF } from '../lib/pdfExtractor';

interface Application {
  id: string;
  businessName: string;
  monthlyRevenue: number;
  timeInBusiness: number;
  creditScore: number;
  industry: string;
  requestedAmount: number;
  status: 'draft' | 'submitted' | 'under-review' | 'approved';
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
}

interface ApplicationFormProps {
  onSubmit: (application: Application) => void;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ onSubmit }) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'form'>('upload');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    ein: '',
    businessType: '',
    industry: '',
    yearsInBusiness: '',
    numberOfEmployees: '',
    annualRevenue: '',
    averageMonthlyRevenue: '',
    averageMonthlyDeposits: '',
    existingDebt: '',
    creditScore: '',
    requestedAmount: '',
    documents: [] as string[]
  });

  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [applicationDocument, setApplicationDocument] = useState<File | null>(null);

  const industries = [
    'Retail', 'Restaurant', 'Healthcare', 'Construction', 'Professional Services',
    'Transportation', 'Manufacturing', 'Technology', 'Real Estate', 'Other'
  ];

  const businessTypes = [
    'Sole Proprietorship', 'Partnership', 'LLC', 'Corporation', 'S-Corporation'
  ];

  const extractDataFromDocument = async (file: File) => {
    setIsExtracting(true);
    
    try {
      const extractedData = await extractDataFromPDF(file);
      setExtractedData(extractedData);
      setFormData(extractedData);
      setCurrentStep('form');
    } catch (error) {
      console.error('Error extracting data from PDF:', error);
      alert('Error extracting data from PDF. Please fill the form manually.');
      setCurrentStep('form');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setApplicationDocument(file);
      await extractDataFromDocument(file);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.businessName) newErrors.businessName = 'Business name is required';
    if (!formData.ownerName) newErrors.ownerName = 'Owner name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.requestedAmount || Number(formData.requestedAmount) < 10000) {
      newErrors.requestedAmount = 'Requested amount must be at least $10,000';
    }
    if (!formData.averageMonthlyRevenue || Number(formData.averageMonthlyRevenue) < 10000) {
      newErrors.averageMonthlyRevenue = 'Monthly revenue must be at least $10,000';
    }
    if (!formData.creditScore || Number(formData.creditScore) < 300 || Number(formData.creditScore) > 850) {
      newErrors.creditScore = 'Credit score must be between 300-850';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const handleSubmitApplication = async () => {
      try {
        const applicationData: Omit<DBApplication, 'id' | 'created_at' | 'updated_at'> = {
          business_name: formData.businessName,
          owner_name: formData.ownerName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          ein: formData.ein,
          business_type: formData.businessType,
          industry: formData.industry,
          years_in_business: Number(formData.yearsInBusiness),
          number_of_employees: Number(formData.numberOfEmployees),
          annual_revenue: Number(formData.annualRevenue),
          monthly_revenue: Number(formData.averageMonthlyRevenue),
          monthly_deposits: Number(formData.averageMonthlyDeposits),
          existing_debt: Number(formData.existingDebt),
          credit_score: Number(formData.creditScore),
          requested_amount: Number(formData.requestedAmount),
          status: 'submitted',
          documents: uploadedFiles
        };

        const savedApplication = await createApplication(applicationData);
        
        // Convert to component format for compatibility
        const application: Application = {
          id: savedApplication.id,
          businessName: savedApplication.business_name,
          monthlyRevenue: savedApplication.monthly_revenue,
          timeInBusiness: savedApplication.years_in_business,
          creditScore: savedApplication.credit_score,
          industry: savedApplication.industry,
          requestedAmount: savedApplication.requested_amount,
          status: savedApplication.status as 'draft' | 'submitted' | 'under-review' | 'matched',
          contactInfo: {
            ownerName: savedApplication.owner_name,
            email: savedApplication.email,
            phone: savedApplication.phone || '',
            address: savedApplication.address || ''
          },
          businessInfo: {
            ein: savedApplication.ein || '',
            businessType: savedApplication.business_type || '',
            yearsInBusiness: savedApplication.years_in_business,
            numberOfEmployees: savedApplication.number_of_employees
          },
          financialInfo: {
            annualRevenue: savedApplication.annual_revenue,
            averageMonthlyRevenue: savedApplication.monthly_revenue,
            averageMonthlyDeposits: savedApplication.monthly_deposits,
            existingDebt: savedApplication.existing_debt
          },
          documents: savedApplication.documents
        };

        onSubmit(application);
      } catch (error) {
        console.error('Error saving application:', error);
        alert('Error saving application. Please try again.');
      }
    };

    handleSubmitApplication();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileNames = Array.from(files).map(file => file.name);
      setUploadedFiles(prev => [...prev, ...fileNames]);
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(file => file !== fileName));
  };

  // Document Upload Step
  if (currentStep === 'upload') {
    return (
      <div className="bg-white rounded-xl shadow-lg">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Upload Application Document</h2>
          <p className="text-gray-600 mt-1">Upload your completed MCA application form to auto-populate the submission</p>
        </div>

        <div className="p-8">
          {!isExtracting ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <div className="text-lg font-medium text-gray-900 mb-2">
                  Upload Your Application Document
                </div>
                <p className="text-gray-600 mb-6">
                  Supported formats: PDF, DOC, DOCX. We'll automatically extract your business information.
                </p>
                <div className="text-sm text-gray-600">
                  <label htmlFor="document-upload" className="relative cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-colors">
                    <span>Choose Application File</span>
                    <input 
                      id="document-upload" 
                      name="document-upload" 
                      type="file" 
                      className="sr-only" 
                      accept=".pdf,.doc,.docx"
                      onChange={handleDocumentUpload} 
                    />
                  </label>
                  <p className="mt-4 text-xs text-gray-500">
                    Maximum file size: 10MB
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Your Document</h3>
              <p className="text-gray-600 mb-4">
                We're extracting information from your application document...
              </p>
              <div className="max-w-md mx-auto">
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">This usually takes 30-60 seconds</p>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep('form')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Skip and fill form manually →
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl shadow-lg">
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Merchant Cash Advance Application</h2>
            <p className="text-gray-600 mt-1">
              {extractedData ? 'Review and confirm the extracted information' : 'Please fill out all required information to get matched with qualified lenders'}
            </p>
          </div>
          {extractedData && (
            <div className="flex items-center text-green-600">
              <FileCheck className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Data extracted from document</span>
            </div>
          )}
        </div>
        {applicationDocument && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <FileText className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm text-blue-800 font-medium">Source Document: {applicationDocument.name}</span>
              <button
                onClick={() => {
                  setCurrentStep('upload');
                  setApplicationDocument(null);
                  setExtractedData(null);
                  setFormData({
                    businessName: '', ownerName: '', email: '', phone: '', address: '', ein: '',
                    businessType: '', industry: '', yearsInBusiness: '', numberOfEmployees: '',
                    annualRevenue: '', averageMonthlyRevenue: '', averageMonthlyDeposits: '',
                    existingDebt: '', creditScore: '', requestedAmount: '', documents: []
                  });
                }}
                className="ml-auto text-blue-600 hover:text-blue-800 text-sm"
              >
                Upload Different Document
              </button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {extractedData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Information Successfully Extracted</h4>
                <p className="text-sm text-green-700 mt-1">
                  We've automatically filled in your application details. Please review and make any necessary corrections below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Business Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-600" />
            Business Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.businessName ? 'border-red-300' : extractedData ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                placeholder="Enter your business name"
              />
              {errors.businessName && <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">EIN</label>
              <input
                type="text"
                value={formData.ein}
                onChange={(e) => setFormData(prev => ({ ...prev, ein: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${extractedData ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                placeholder="XX-XXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
              <select
                value={formData.businessType}
                onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${extractedData ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
              >
                <option value="">Select business type</option>
                {businessTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${extractedData ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
              >
                <option value="">Select industry</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years in Business</label>
              <input
                type="number"
                value={formData.yearsInBusiness}
                onChange={(e) => setFormData(prev => ({ ...prev, yearsInBusiness: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${extractedData ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Employees</label>
              <input
                type="number"
                value={formData.numberOfEmployees}
                onChange={(e) => setFormData(prev => ({ ...prev, numberOfEmployees: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${extractedData ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name *</label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.ownerName ? 'border-red-300' : extractedData ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                placeholder="Enter owner's full name"
              />
              {errors.ownerName && <p className="text-red-500 text-sm mt-1">{errors.ownerName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-300' : extractedData ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                placeholder="Enter email address"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.phone ? 'border-red-300' : extractedData ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                placeholder="(555) 123-4567"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${extractedData ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                placeholder="Enter business address"
              />
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
            Financial Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Annual Revenue</label>
              <input
                type="number"
                value={formData.annualRevenue}
                onChange={(e) => setFormData(prev => ({ ...prev, annualRevenue: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${extractedData ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Average Monthly Revenue *</label>
              <input
                type="number"
                value={formData.averageMonthlyRevenue}
                onChange={(e) => setFormData(prev => ({ ...prev, averageMonthlyRevenue: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.averageMonthlyRevenue ? 'border-red-300' : extractedData ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                placeholder="0"
                min="0"
              />
              {errors.averageMonthlyRevenue && <p className="text-red-500 text-sm mt-1">{errors.averageMonthlyRevenue}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Average Monthly Deposits</label>
              <input
                type="number"
                value={formData.averageMonthlyDeposits}
                onChange={(e) => setFormData(prev => ({ ...prev, averageMonthlyDeposits: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${extractedData ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Existing Debt</label>
              <input
                type="number"
                value={formData.existingDebt}
                onChange={(e) => setFormData(prev => ({ ...prev, existingDebt: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${extractedData ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Credit Score *</label>
              <input
                type="number"
                value={formData.creditScore}
                onChange={(e) => setFormData(prev => ({ ...prev, creditScore: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.creditScore ? 'border-red-300' : extractedData ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                placeholder="300-850"
                min="300"
                max="850"
              />
              {errors.creditScore && <p className="text-red-500 text-sm mt-1">{errors.creditScore}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Requested Amount *</label>
              <input
                type="number"
                value={formData.requestedAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, requestedAmount: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.requestedAmount ? 'border-red-300' : extractedData ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                placeholder="10000"
                min="10000"
              />
              {errors.requestedAmount && <p className="text-red-500 text-sm mt-1">{errors.requestedAmount}</p>}
            </div>
          </div>
        </div>

        {/* Additional Documents */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-blue-600" />
            Additional Documents
          </h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <div className="text-sm text-gray-600 mb-2">
                Upload additional supporting documents (bank statements, tax returns, etc.)
              </div>
              <label htmlFor="file-upload" className="relative cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-colors">
                <span>Choose Files</span>
                <input 
                  id="file-upload" 
                  name="file-upload" 
                  type="file" 
                  className="sr-only" 
                  multiple
                  onChange={handleFileUpload} 
                />
              </label>
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h4>
                <div className="space-y-2">
                  {uploadedFiles.map((fileName, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-700">{fileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(fileName)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="submit"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Submit Application
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;