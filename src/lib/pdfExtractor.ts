import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface ExtractedData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  ein: string;
  businessType: string;
  industry: string;
  yearsInBusiness: string;
  numberOfEmployees: string;
  annualRevenue: string;
  averageMonthlyRevenue: string;
  averageMonthlyDeposits: string;
  existingDebt: string;
  creditScore: string;
  requestedAmount: string;
}

export const extractDataFromPDF = async (file: File): Promise<ExtractedData> => {
  try {
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + ' ';
    }
    
    // Extract data using regex patterns and text analysis
    const extractedData = parseTextForApplicationData(fullText);
    
    return extractedData;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract data from PDF');
  }
};

const parseTextForApplicationData = (text: string): ExtractedData => {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Define regex patterns for specific PDF form fields
  const patterns = {
    businessName: [
      /business\s+dba\s+name[:\s]+([^\n\r]+)/i,
      /(?:business\s+name|company\s+name|legal\s+name)[:\s]+([^\n\r]+)/i,
      /(?:dba|doing\s+business\s+as)[:\s]+([^\n\r]+)/i
    ],
    ownerName: [
      /(?:^|\s)name[:\s]+([^\n\r]+)/i,
      /(?:owner\s+name|principal\s+name|applicant\s+name)[:\s]+([^\n\r]+)/i,
      /(?:first\s+name\s+last\s+name|full\s+name)[:\s]+([^\n\r]+)/i
    ],
    email: [
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      /(?:email|e-mail)[:\s]+([^\s\n\r]+)/i
    ],
    phone: [
      /(?:phone|telephone|cell|mobile)[:\s]*(\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/i,
      /(\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g
    ],
    address: [
      /address\s+cty\s+state\s+zip[:\s]+([^\n\r]+(?:\s+[^\n\r]+)*)/i,
      /(?:business\s+address|address)[:\s]+([^\n\r]+(?:\s+[^\n\r]+)*)/i,
      /(?:street|address\s+line)[:\s]+([^\n\r]+)/i
    ],
    ein: [
      /federal\s+tax\s+id\s*#[:\s]*(\d{2}-?\d{7})/i,
      /(?:federal\s+tax\s+id|tax\s+id\s*#)[:\s]*(\d{2}-?\d{7})/i,
      /(?:ein|tax\s+id|federal\s+id)[:\s]*(\d{2}-?\d{7})/i,
      /(\d{2}-\d{7})/g
    ],
    businessType: [
      /(?:business\s+type|entity\s+type|legal\s+structure)[:\s]+([^,\n]+)/i,
      /(?:llc|corporation|partnership|sole\s+proprietorship|s-corp|c-corp)/i
    ],
    industry: [
      /(?:industry|business\s+type|nature\s+of\s+business)[:\s]+([^,\n]+)/i,
      /(?:retail|restaurant|healthcare|construction|professional\s+services|transportation|manufacturing|technology|real\s+estate)/i
    ],
    yearsInBusiness: [
      /(?:years\s+in\s+business|time\s+in\s+business)[:\s]*(\d+(?:\.\d+)?)/i,
      /(?:established|started)[:\s]*(\d{4})/i
    ],
    numberOfEmployees: [
      /(?:number\s+of\s+employees|employees|staff\s+size)[:\s]*(\d+)/i,
      /(\d+)\s+employees/i
    ],
    annualRevenue: [
      /(?:annual\s+revenue|yearly\s+revenue|annual\s+sales)[:\s]*\$?([0-9,]+)/i,
      /(?:gross\s+revenue)[:\s]*\$?([0-9,]+)/i
    ],
    averageMonthlyRevenue: [
      /(?:monthly\s+revenue|average\s+monthly\s+sales)[:\s]*\$?([0-9,]+)/i,
      /(?:monthly\s+gross)[:\s]*\$?([0-9,]+)/i
    ],
    averageMonthlyDeposits: [
      /(?:monthly\s+deposits|average\s+monthly\s+deposits)[:\s]*\$?([0-9,]+)/i,
      /(?:bank\s+deposits)[:\s]*\$?([0-9,]+)/i
    ],
    existingDebt: [
      /(?:existing\s+debt|current\s+debt|outstanding\s+debt)[:\s]*\$?([0-9,]+)/i,
      /(?:debt\s+balance)[:\s]*\$?([0-9,]+)/i
    ],
    creditScore: [
      /(?:credit\s+score|fico\s+score|personal\s+credit)[:\s]*(\d{3})/i,
      /(?:score)[:\s]*(\d{3})/i
    ],
    requestedAmount: [
      /amount\s+requested[:\s]*\$?([0-9,]+)/i,
      /(?:requested\s+amount|loan\s+amount|funding\s+amount)[:\s]*\$?([0-9,]+)/i,
      /(?:amount\s+needed|capital\s+needed)[:\s]*\$?([0-9,]+)/i
    ]
  };
  
  const extractedData: ExtractedData = {
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
    requestedAmount: ''
  };
  
  // Extract each field using patterns
  Object.keys(patterns).forEach(field => {
    const fieldPatterns = patterns[field as keyof typeof patterns];
    
    for (const pattern of fieldPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        let value = match[1].trim().replace(/\s+/g, ' ');
        
        // Clean up extracted values
        if (field.includes('Revenue') || field.includes('Amount') || field.includes('Debt') || field.includes('Deposits')) {
          value = value.replace(/[,$]/g, '');
        }
        
        if (field === 'phone') {
          value = value.replace(/[^\d]/g, '');
          if (value.length === 10) {
            value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6)}`;
          }
        }
        
        if (field === 'ein' && value.length === 9) {
          value = `${value.slice(0,2)}-${value.slice(2)}`;
        }
        
        // Clean up address formatting
        if (field === 'address') {
          value = value.replace(/\s+/g, ' ').trim();
        }
        
        extractedData[field as keyof ExtractedData] = value;
        break;
      }
    }
  });
  
  // Log extracted data for debugging
  console.log('PDF Extraction Results:', extractedData);
  
  // Post-processing: try to infer missing data
  if (!extractedData.businessType && cleanText.toLowerCase().includes('llc')) {
    extractedData.businessType = 'LLC';
  }
  
  if (!extractedData.yearsInBusiness && extractedData.businessName) {
    const currentYear = new Date().getFullYear();
    const yearMatch = cleanText.match(/(?:established|started|founded)[:\s]*(\d{4})/i);
    if (yearMatch) {
      extractedData.yearsInBusiness = (currentYear - parseInt(yearMatch[1])).toString();
    }
  }
  
  // Calculate monthly revenue from annual if missing
  if (!extractedData.averageMonthlyRevenue && extractedData.annualRevenue) {
    const annual = parseInt(extractedData.annualRevenue.replace(/[,$]/g, ''));
    if (!isNaN(annual)) {
      extractedData.averageMonthlyRevenue = Math.round(annual / 12).toString();
    }
  }
  
  return extractedData;
};