import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new'; // Keep using react-quill-new
import 'react-quill/dist/quill.snow.css'; // Keep using react-quill-new CSS
import { Copy, Check, Code, FileText, Tag, Eye, Edit } from 'lucide-react';

// Create a function to generate CSS styles based on dark mode
const createEditorStyles = (darkMode) => `
  /* Base editor styles */
  .ql-editor p {
    margin-bottom: 10px;
  }
  
  /* Dark mode styles */
  .quill-editor-dark .ql-container {
    background-color: #1e1e1e;
    color: #ffffff;
    border-color: #444;
  }
  
  .quill-editor-dark .ql-toolbar {
    background-color: #2d2d2d;
    border-color: #444;
    color: #ffffff;
  }
  
  .quill-editor-dark .ql-editor {
    color: #ffffff;
  }
  
  /* Invert placeholder text color for dark mode */
  .quill-editor-dark .ql-editor.ql-blank::before {
    color: #cccccc !important;
    font-style: italic;
  }
  
  .quill-editor-dark .ql-stroke {
    stroke: #e0e0e0;
  }
  
  .quill-editor-dark .ql-fill {
    fill: #e0e0e0;
  }
  
  .quill-editor-dark .ql-picker {
    color: #e0e0e0;
  }
  
  .quill-editor-dark .ql-picker-options {
    background-color: #2d2d2d;
    border-color: #444;
  }
  
  .quill-editor-dark .ql-tooltip {
    background-color: #2d2d2d;
    border-color: #444;
    color: #e0e0e0;
  }
`;

const ProposalQuillEditor = ({ 
  initialValue = '', 
  onChange, 
  height = '300px',
  placeholder = 'Describe your proposal in detail...',
  readOnly = false,
  isSignalingProposal = false,
  darkMode = false,
  onCreateProposal = null
}) => {
  const quillRef = useRef(null);
  
  // Add CSS class based on dark mode
  const editorClassName = darkMode 
    ? 'quill-editor-dark' 
    : 'quill-editor-light';

  const [editorValue, setEditorValue] = useState(initialValue);
  const [copied, setCopied] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [customHtml, setCustomHtml] = useState('');
  const [showHtmlTemplateModal, setShowHtmlTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showJurisdictionModal, setShowJurisdictionModal] = useState(false);
  const [jurisdictionInfo, setJurisdictionInfo] = useState({
    jurisdiction: '',
    caseType: '',
    legalCode: '',
    applicableLaw: '',
    enforcementAgency: ''
  });

  // Inject styles into the document head for dark mode
  useEffect(() => {
    // Create a style element if it doesn't exist
    let styleEl = document.getElementById('proposal-editor-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'proposal-editor-styles';
      document.head.appendChild(styleEl);
    }
    
    // Set the styles based on dark mode
    styleEl.textContent = createEditorStyles(darkMode);
    
    // Clean up on unmount
    return () => {
      if (styleEl && document.head.contains(styleEl)) {
        document.head.removeChild(styleEl);
      }
    };
  }, [darkMode]);

 // Gas-optimized HTML templates with reduced list tag usage
const htmlTemplates = {
  basic: `<h1>Strategic Case Initiative</h1>
<p><b>New Project Proposal</b></p>

<h2>Initiative Overview</h2>
<b>Legal issue:</b> [Area of law]
<b>Jurisdiction:</b> [Court/Location]
<b>Strategic importance:</b> [Precedential value]
<b>Timeline:</b> [Expected duration]

<h2>Legal Strategy</h2>
<p>Proposed approach to secure favorable outcome:</p>
Primary legal theories and arguments
Key authorities and precedents
Litigation or advocacy strategy
Potential challenges and mitigations

<h2>Resource Requirements</h2>
<h3>Budget</h3>
<b>Legal research:</b> [Amount]
<b>Brief preparation:</b> [Amount]
<b>Court costs:</b> [Amount]
<b>Expert testimony:</b> [Amount]
<b>Total requested:</b> [Amount]

<h3>Project Phases</h3>
<ol>
  <li><b>[Date]:</b> Initial stage</li>
  <li><b>[Date]:</b> First Stage</li>
  <li><b>[Date]:</b> Second Stage</li>
  <li><b>[Date]:</b> Project Completion</li>
</ol>

<h2>Systemic Impact</h2>
<p>This initiative advances legal reform through:</p>
Setting important legal precedent, 
Challenging harmful practices, 
Creating model for future advocacy, 
...

<h2>Evaluation & Reporting</h2>
...`,
  
  treasuryAllocation: `<h1>Legal Aid Program Funding</h1>
<p><b>Request for ongoing program support</b></p>

<h2>Program Description</h2>
<b>Program name:</b> [Program title]
<b>Legal focus:</b> [Area of practice]
<b>Geographic scope:</b> [Service area]
<b>Duration:</b> [Program timeframe]

<h2>Services To Be Provided</h2>
<p>This program will deliver:</p>
<b>Legal clinics:</b> [Frequency/locations]
<b>Know-your-rights training:</b> [Format/audiences]
<b>Direct representation:</b> [Case types/volume]
<b>Policy advocacy:</b> [Focus areas]

<h2>Organizational Capacity</h2>
<b>Staff attorneys:</b> [Number/experience]
<b>Support personnel:</b> [Roles/counts]
<b>Prior similar programs:</b> [Track record]
<b>Infrastructure:</b> [Existing resources]

<h2>Budget Allocation</h2>
<b>Personnel:</b> [Amount]
<b>Operations:</b> [Amount]
<b>Case costs:</b> [Amount]
<b>Technology:</b> [Amount]
<b>Administration:</b> [Amount]
<b>Total requested:</b> [Amount]

<h2>Expected Outcomes</h2>
<ol>
  <li><b>Service metrics:</b> [Number served]</li>
  <li><b>Success indicators:</b> [Case outcomes]</li>
  <li><b>Community impact:</b> [Broader effects]</li>
  <li><b>Sustainability plan:</b> [Future funding]</li>
</ol>

<h2>Accountability Framework</h2>
<b>...</b>`,
  
  legalAid: `<h1>Provider Network Application</h1>
<p><b>Application to join legal aid provider network</b></p>

<h2>Provider Information</h2>
<b>Organization/Firm:</b> [Name]
<b>Address:</b> [Office location]
<b>Years in practice:</b> [Experience]
<b>Wallet address:</b> [Payment address]

<h2>Legal Expertise</h2>
<p>Areas of specialization:</p>
<b>Primary practice:</b> [Main focus]
<b>Additional areas:</b> [Other competencies]
<b>Bar admissions:</b> [Jurisdictions]
<b>Languages:</b> [Client communication]

<h2>Service Commitment</h2>
<b>Hours available:</b> [Monthly capacity]
<b>Case acceptance criteria:</b> [Types of matters]
<b>Geographic reach:</b> [Service radius]
<b>Virtual services:</b> [Remote capabilities]

<h2>Fee Structure</h2>

<b>Hourly rate:</b> [Amount requested]
<b>Alternative arrangements:</b> [Flat fees/contingency]
<b>Pro bono commitment:</b> [Hours/percentage]
  <b>Expense policy:</b> [Handling costs]


<h2>Track Record</h2>
<b>Similar initiatives:</b> [Past experience]
<b>Notable outcomes:</b> [Significant results]
<b>References:</b> [Professional contacts]
<b>Malpractice coverage:</b> [Insurance details]

<h2>Integration Plan</h2>
<n>...</n>`,
};

  // Update editorValue when initialValue changes from parent
  useEffect(() => {
    setEditorValue(initialValue);
  }, [initialValue]);

  const handleEditorChange = (content) => {
    setEditorValue(content);
    if (onChange) {
      // Extract plain text content for the parent component
      const tempEl = document.createElement('div');
      tempEl.innerHTML = content;
      const plainText = tempEl.textContent || tempEl.innerText || '';
      onChange(content, plainText);
    }
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const copyToClipboard = () => {
    // Get plain text content
    const tempEl = document.createElement('div');
    tempEl.innerHTML = editorValue;
    const plainText = tempEl.textContent || tempEl.innerText || '';
    
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const toggleHtmlModal = () => {
    setShowHtmlModal(!showHtmlModal);
  };

  const toggleHtmlTemplateModal = () => {
    setShowHtmlTemplateModal(!showHtmlTemplateModal);
  };

  const toggleJurisdictionModal = () => {
    setShowJurisdictionModal(!showJurisdictionModal);
  };
  
  const insertCustomHtml = () => {
    // Validate HTML to only include allowed tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = customHtml;
    
    // Filter out disallowed elements
    const allowedTags = ['H1', 'H2', 'H3', 'P', 'B', 'I', 'U', 'A', 'OL', 'LI'];
    const nodes = tempDiv.querySelectorAll('*');
    
    Array.from(nodes).forEach(node => {
      if (!allowedTags.includes(node.tagName)) {
        // Replace disallowed element with its text content
        node.outerHTML = node.textContent;
      }
    });
    
    // Get the sanitized HTML
    const sanitizedHtml = tempDiv.innerHTML;
    
    // Insert the sanitized HTML into the editor
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection();
    const index = range ? range.index : editor.getLength();
    
    editor.clipboard.dangerouslyPasteHTML(index, sanitizedHtml);
    
    // Close the modal and clear the input
    setShowHtmlModal(false);
    setCustomHtml('');
  };

  const insertHtmlTemplate = () => {
    if (!selectedTemplate || !htmlTemplates[selectedTemplate]) {
      return;
    }

    // Get the selected template
    const templateHtml = htmlTemplates[selectedTemplate];
    
    // Insert the template HTML at the current cursor position or at the beginning
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection();
    const index = range ? range.index : 0;
    
    editor.clipboard.dangerouslyPasteHTML(index, templateHtml);
    
    // Close the modal and reset selection
    setShowHtmlTemplateModal(false);
    setSelectedTemplate('');
  };

  const addJurisdictionMetadata = () => {
    // Skip if jurisdiction is empty
    if (!jurisdictionInfo.jurisdiction.trim()) {
      alert('Jurisdiction is required');
      return;
    }

    // Format the jurisdiction metadata with gas-optimized simplified format
    const metadataHtml = `
<h3>Legal Aid Case Information</h3>
<p><b>Jurisdiction:</b> ${jurisdictionInfo.jurisdiction}</p>
${jurisdictionInfo.caseType ? `<p><b>Case Type:</b> ${jurisdictionInfo.caseType}</p>` : ''}
${jurisdictionInfo.legalCode ? `<p><b>Legal Code:</b> ${jurisdictionInfo.legalCode}</p>` : ''}
${jurisdictionInfo.applicableLaw ? `<p><b>Applicable Law:</b> ${jurisdictionInfo.applicableLaw}</p>` : ''}
${jurisdictionInfo.enforcementAgency ? `<p><b>Agency:</b> ${jurisdictionInfo.enforcementAgency}</p>` : ''}
`;

    // Insert the metadata HTML into the editor
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection();
    const index = range ? range.index : 0; // Insert at current position or beginning
    
    editor.clipboard.dangerouslyPasteHTML(index, metadataHtml);
    
    // Close the modal and reset form
    setShowJurisdictionModal(false);
    setJurisdictionInfo({
      jurisdiction: '',
      caseType: '',
      legalCode: '',
      applicableLaw: '',
      enforcementAgency: ''
    });
  };


  // FIXED: Updated Quill editor modules configuration for react-quill-new
  // Removed bullet list from the toolbar
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }], // Removed bullet list option, keeping only ordered list
      ['link'],
      ['clean']
    ]
  };

  // FIXED: Correctly configured formats for react-quill-new
  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', // This still works for ordered lists only when bullet list is removed from toolbar
    'link'
  ];

  // Header background and text styles
  const headerBgStyle = darkMode 
    ? { backgroundColor: '#2d2d2d' }  // Dark background for header
    : { backgroundColor: '#f9fafb' }; // Light gray background for header

  // Mode label styles - Invert text color based on dark mode
  const modeLabelStyle = darkMode
    ? { color: '#ffffff', fontWeight: '600' }  // Light text for dark mode
    : { color: '#000000', fontWeight: '600' }; // Dark text for light mode

  return (
    <div className={editorClassName}>
      <div className="proposal-editor-container border border-gray-300 rounded-md overflow-hidden">
        {/* Editor Toolbar - With Dark Background */}
        <div className="flex justify-between items-center px-3 py-2 border-b border-gray-300" 
            style={headerBgStyle}>
          <div className="flex items-center space-x-2">
          
            <h3 className="text-sm font-medium editor-mode-label" style={modeLabelStyle}>
              {isPreviewMode ? 'Preview Mode' : 'Edit Mode'}
            </h3>
          </div>
          <div className="flex space-x-2">
            {/* HTML Templates button - only show in edit mode */}
            {!isPreviewMode && !readOnly && (
              <button
                type="button"
                onClick={toggleHtmlTemplateModal}
                className={`p-1 rounded-full transition-colors ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                title="Insert Template"
              >
                <FileText className="h-4 w-4" />
              </button>
            )}
            
            {/* Jurisdiction button - only show in edit mode */}
            {!isPreviewMode && !readOnly && (
              <button
                type="button"
                onClick={toggleJurisdictionModal}
                className={`p-1 rounded-full transition-colors ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                title="Add Legal Jurisdiction"
              >
                <Tag className="h-4 w-4" />
              </button>
            )}
            
            {/* Copy button */}
            <button
              type="button"
              onClick={copyToClipboard}
              className={`p-1 rounded-full transition-colors ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
              title="Copy content"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
            
            {/* Custom HTML button - only show in edit mode */}
            {!isPreviewMode && !readOnly && (
              <button
                type="button"
                onClick={toggleHtmlModal}
                className={`p-1 rounded-full transition-colors ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                title="Insert custom HTML"
              >
                <Code className="h-4 w-4" />
              </button>
            )}
            
          </div>
        </div>

        {/* Editor with allowed HTML info or Preview */}
        <div style={{ minHeight: height }}>
          {isPreviewMode ? (
            <div 
              className="p-4 overflow-y-auto preview-content"
              style={{ 
                minHeight: height,
                color: darkMode ? '#e0e0e0' : 'inherit',
                backgroundColor: darkMode ? '#1e1e1e' : 'white'
              }}
              dangerouslySetInnerHTML={{ __html: editorValue }}
            />
          ) : (
            <div className="quill-editor-container" style={{ minHeight: height }}>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={editorValue}
                onChange={handleEditorChange}
                modules={modules}
                formats={formats}
                readOnly={readOnly}
              />
              {/* Updated allowed tags text to include lists */}
              <div className="p-2 text-xs text-gray-500 border-t border-gray-200">
                Allowed HTML tags: <b>h1-h3</b> (headings), <b>p</b> (paragraphs), <b>b</b> (bold), <b>i</b> (italic), <b>u</b> (underline), <b>a</b> (links), <b>ol/li</b> (numbered lists)
              </div>
            </div>
          )}
        </div>
        
       
      </div>
      
      {/* HTML Injection Modal */}
      {showHtmlModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'bg-black bg-opacity-70' : 'bg-gray-500 bg-opacity-50'}`}>
          <div className={`relative w-full max-w-md p-4 mx-auto rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="mb-4">
              <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Insert Custom HTML
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                Only allowed tags (h1-h3, p, b, i, u, a, ol, li) will be inserted.
              </p>
            </div>
            
            <textarea
              value={customHtml}
              onChange={(e) => setCustomHtml(e.target.value)}
              className={`w-full h-40 p-2 mb-4 border rounded-md ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
              placeholder="<h1>Title</h1><p>Content with <b>bold</b> text</p><ol><li>List item 1</li><li>List item 2</li></ol>"
            />
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowHtmlModal(false)}
                className={`px-3 py-1.5 text-sm rounded-md ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertCustomHtml}
                className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HTML Template Modal - Simplified for gas efficiency */}
      {showHtmlTemplateModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'bg-black bg-opacity-70' : 'bg-gray-500 bg-opacity-50'}`}>
          <div className={`relative w-full max-w-md p-4 mx-auto rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="mb-4">
              <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Insert Template
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                Choose a gas-optimized template for blockchain storage
              </p>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className={`p-3 border rounded-md cursor-pointer transition-all ${selectedTemplate === 'basic' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'} ${darkMode && selectedTemplate === 'basic' ? 'bg-blue-900 border-blue-500' : darkMode ? 'border-gray-600 hover:border-blue-700' : ''}`}
                  onClick={() => setSelectedTemplate('basic')}>
                <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Strategic Case Initiative</div>
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Project Commencement Proposal</div>
              </div>
              
              <div className={`p-3 border rounded-md cursor-pointer transition-all ${selectedTemplate === 'treasuryAllocation' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'} ${darkMode && selectedTemplate === 'treasuryAllocation' ? 'bg-blue-900 border-blue-500' : darkMode ? 'border-gray-600 hover:border-blue-700' : ''}`}
                  onClick={() => setSelectedTemplate('treasuryAllocation')}>
                <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Treasury Allocation</div>
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Request for DAO funds</div>
              </div>
              
              <div className={`p-3 border rounded-md cursor-pointer transition-all ${selectedTemplate === 'legalAid' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'} ${darkMode && selectedTemplate === 'legalAid' ? 'bg-blue-900 border-blue-500' : darkMode ? 'border-gray-600 hover:border-blue-700' : ''}`}
                  onClick={() => setSelectedTemplate('legalAid')}>
                <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Provider Network Application</div>
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Template for new legal aid providers</div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowHtmlTemplateModal(false)}
                className={`px-3 py-1.5 text-sm rounded-md ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertHtmlTemplate}
                disabled={!selectedTemplate}
                className={`px-3 py-1.5 text-sm text-white rounded-md ${selectedTemplate ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 cursor-not-allowed'}`}
              >
                Insert Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Jurisdiction Modal - Simplified for gas efficiency */}
      {showJurisdictionModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'bg-black bg-opacity-70' : 'bg-gray-500 bg-opacity-50'}`}>
          <div className={`relative w-full max-w-md p-4 mx-auto rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="mb-4">
              <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Add Legal Jurisdiction Metadata
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                Add jurisdiction information relevant to this legal aid case.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Jurisdiction *
                </label>
                <input
                  type="text"
                  value={jurisdictionInfo.jurisdiction}
                  onChange={(e) => setJurisdictionInfo({...jurisdictionInfo, jurisdiction: e.target.value})}
                  className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                  placeholder="e.g., California, Federal, International"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Case Type
                </label>
                <select
                  value={jurisdictionInfo.caseType || ''}
                  onChange={(e) => setJurisdictionInfo({...jurisdictionInfo, caseType: e.target.value})}
                  className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                >
                  <option value="">Select Case Type</option>
                  <option value="Consumer Protection">Consumer Protection</option>
                  <option value="Foreclosure Defense">Foreclosure Defense</option>
                  <option value="Bankruptcy">Bankruptcy</option>
                  <option value="Debt Collection Defense">Debt Collection Defense</option>
                  <option value="Housing Rights">Housing Rights</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Legal Code Reference
                </label>
                <input
                  type="text"
                  value={jurisdictionInfo.legalCode}
                  onChange={(e) => setJurisdictionInfo({...jurisdictionInfo, legalCode: e.target.value})}
                  className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                  placeholder="e.g., 15 U.S.C. § 1692"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Applicable Law/Precedent
                </label>
                <textarea
                  value={jurisdictionInfo.applicableLaw}
                  onChange={(e) => setJurisdictionInfo({...jurisdictionInfo, applicableLaw: e.target.value})}
                  className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                  placeholder="Brief description of relevant laws"
                  rows={2}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Enforcement Agency
                </label>
                <input
                  type="text"
                  value={jurisdictionInfo.enforcementAgency || ''}
                  onChange={(e) => setJurisdictionInfo({...jurisdictionInfo, enforcementAgency: e.target.value})}
                  className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                  placeholder="e.g., CFPB, FTC"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="button"
                onClick={() => setShowJurisdictionModal(false)}
                className={`px-3 py-1.5 text-sm rounded-md ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addJurisdictionMetadata}
                className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Add Metadata
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modified helper function to include jurisdiction metadata in blockchain format with gas optimization
const createProposalWithHtml = (description, proposalType, target, callData, amount, recipient, externalToken, newThreshold, newQuorum, newVotingDuration, newTimelockDelay) => {
  // Parse the description to extract legal jurisdiction metadata
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = description;
  
  // Extract legal metadata with more gas-efficient approach
  let jurisdiction = '';
  let caseType = '';
  let legalCode = '';
  let applicableLaw = '';
  let enforcementAgency = '';
  
  // Look for legal metadata in an optimized way
  const jurisdictionEl = tempDiv.querySelector('p:contains("Jurisdiction:")');
  if (jurisdictionEl) {
    jurisdiction = jurisdictionEl.textContent.replace('Jurisdiction:', '').trim();
  }
  
  const caseTypeEl = tempDiv.querySelector('p:contains("Case Type:")');
  if (caseTypeEl) {
    caseType = caseTypeEl.textContent.replace('Case Type:', '').trim();
  }
  
  const legalCodeEl = tempDiv.querySelector('p:contains("Legal Code:")');
  if (legalCodeEl) {
    legalCode = legalCodeEl.textContent.replace('Legal Code:', '').trim();
  }
  
  const applicableLawEl = tempDiv.querySelector('p:contains("Applicable Law:")');
  if (applicableLawEl) {
    applicableLaw = applicableLawEl.textContent.replace('Applicable Law:', '').trim();
  }
  
  const enforcementAgencyEl = tempDiv.querySelector('p:contains("Agency:")');
  if (enforcementAgencyEl) {
    enforcementAgency = enforcementAgencyEl.textContent.replace('Agency:', '').trim();
  }
  
  // Generate a gas-efficient blockchain-compatible metadata string
  const metadataStr = jurisdiction 
    ? `L:${jurisdiction}:${caseType || ''}:${legalCode || ''}` 
    : '';
  
  // Inject minimal metadata (no unnecessary HTML)
  const timestamp = new Date().toISOString().split('T')[0]; // Just the date part
  const proposalTypeNames = [
    'Legal Aid', 'Fund Transfer', 'External Service', 'Governance Change'
  ];
  
  // Return the proposal with metadata added efficiently
  return {
    description,
    proposalType,
    target,
    callData,
    amount,
    recipient,
    externalToken,
    newThreshold,
    newQuorum,
    newVotingDuration,
    newTimelockDelay,
    // Add blockchain-compatible metadata string
    legalMetadata: metadataStr,
    timestamp,
    typeName: proposalTypeNames[proposalType] || 'Unknown'
  };
};

export default ProposalQuillEditor;