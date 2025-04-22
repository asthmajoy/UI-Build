import React, { useState } from 'react';
import { 
  Home, 
  Network, 
  BarChart4, 
  CircleDollarSign, 
  Coins, 
  Landmark, 
  Users,
  TrendingUp,
  Award,
  Target,
  ChevronDown,
  ChevronRight,
  FileLock,
  Split,
  Gavel,
  PersonStanding,
  ExternalLink} from 'lucide-react';

const LegalIssueCard = ({ number, title, color, initialContent, expandedContent }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const colorClasses = {
    red: {
      bg: "bg-gradient-to-r from-red-50 to-red-100 dark:bg-gradient-to-br dark:from-red-900/20 dark:to-red-800/30",
      border: "border-red-100 dark:border-red-800/40",
      circlebg: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/40",
      circleborder: "border-red-200 dark:border-red-700/50",
      text: "text-red-600 dark:text-red-300",
      heading: "text-red-700 dark:text-red-300"
    },
    amber: {
      bg: "bg-gradient-to-r from-amber-50 to-amber-100 dark:bg-gradient-to-br dark:from-amber-900/20 dark:to-amber-800/30",
      border: "border-amber-100 dark:border-amber-800/40",
      circlebg: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/40",
      circleborder: "border-amber-200 dark:border-amber-700/50",
      text: "text-amber-600 dark:text-amber-300",
      heading: "text-amber-700 dark:text-amber-300"
    },
    rose: {
      bg: "bg-gradient-to-r from-rose-50 to-rose-100 dark:bg-gradient-to-br dark:from-rose-900/20 dark:to-rose-800/30",
      border: "border-rose-100 dark:border-rose-800/40",
      circlebg: "bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/40",
      circleborder: "border-rose-200 dark:border-rose-700/50",
      text: "text-rose-600 dark:text-rose-300",
      heading: "text-rose-700 dark:text-rose-300"
    },
    purple: {
      bg: "bg-gradient-to-r from-purple-50 to-purple-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:to-purple-800/30",
      border: "border-purple-100 dark:border-purple-800/40",
      circlebg: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/40",
      circleborder: "border-purple-200 dark:border-purple-700/50",
      text: "text-purple-600 dark:text-purple-300",
      heading: "text-purple-700 dark:text-purple-300"
    },
    orange: {
      bg: "bg-gradient-to-r from-orange-50 to-orange-100 dark:bg-gradient-to-br dark:from-orange-900/20 dark:to-orange-800/30",
      border: "border-orange-100 dark:border-orange-800/40",
      circlebg: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/40",
      circleborder: "border-orange-200 dark:border-orange-700/50",
      text: "text-orange-600 dark:text-orange-300",
      heading: "text-orange-700 dark:text-orange-300"
    },
    yellow: {
      bg: "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:bg-gradient-to-br dark:from-yellow-900/20 dark:to-yellow-800/30",
      border: "border-yellow-100 dark:border-yellow-800/40",
      circlebg: "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/40",
      circleborder: "border-yellow-200 dark:border-yellow-700/50",
      text: "text-yellow-600 dark:text-yellow-300",
      heading: "text-yellow-700 dark:text-yellow-300"
    },
    green: {
      bg: "bg-gradient-to-r from-green-50 to-green-100 dark:bg-gradient-to-br dark:from-green-900/20 dark:to-green-800/30",
      border: "border-green-100 dark:border-green-800/40",
      circlebg: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/40",
      circleborder: "border-green-200 dark:border-green-700/50",
      text: "text-green-600 dark:text-green-300",
      heading: "text-green-700 dark:text-green-300"
    }
  };
  
  const classes = colorClasses[color];
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-md shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <button 
        onClick={toggleExpand}
        className={`w-full ${classes.bg} px-4 py-3 border-b ${classes.border} hover:opacity-90 transition-opacity focus:outline-none`}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Collapse section" : "Expand section"}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center ${classes.circlebg} border ${classes.circleborder} mr-2`}>
              <span className={`text-sm ${classes.text}`}>{number}</span>
            </div>
            <h4 className={`text-sm font-medium ${classes.heading}`}>{title}</h4>
          </div>
          {isExpanded ? 
            <ChevronDown className={`h-4 w-4 ${classes.text}`} /> : 
            <ChevronRight className={`h-4 w-4 ${classes.text}`} />
          }
        </div>
      </button>
      <div className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {initialContent}
        </p>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400">
            {expandedContent}
          </div>
        )}
      </div>
    </div>
  );
};

// Collapsible card for the "Human Cost" section
const HumanCostCard = ({ title, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  return (
    <div className={`${isExpanded ? 'md:col-span-3' : ''} transition-all duration-300 p-3 bg-white dark:bg-gray-900 rounded-md border border-gray-100 dark:border-gray-800 shadow-sm`}>
      <button 
        onClick={toggleExpand}
        className="w-full flex items-center hover:opacity-90 transition-opacity focus:outline-none"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Collapse section" : "Expand section"}
      >
        <div 
          className="mr-2 h-5 w-5 flex-shrink-0 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 hover:bg-red-100 dark:hover:bg-red-800/40 transition-colors"
        >
          {isExpanded ? 
            <ChevronDown className="h-3 w-3 text-red-500 dark:text-red-400" /> : 
            <ChevronRight className="h-3 w-3 text-red-500 dark:text-red-400" />
          }
        </div>
        <span className="text-gray-800 dark:text-gray-200 font-medium">{title}</span>
      </button>
      
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400">
          {children}
        </div>
      )}
    </div>
  );
};

// Collapsible card for the "How JustDAO Helps" section
const SupportCard = ({ title, icon: Icon, initialContent, expandedContent }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-md shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <button 
        onClick={toggleExpand}
        className="w-full bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 border-b border-indigo-100 dark:border-indigo-900/30 hover:opacity-90 transition-opacity focus:outline-none"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Collapse section" : "Expand section"}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {Icon && <Icon className="h-4 w-4 text-indigo-500 dark:text-indigo-400 mr-2" />}
            <h4 className="text-sm font-medium text-indigo-700 dark:text-indigo-400">{title}</h4>
          </div>
          {isExpanded ? 
            <ChevronDown className="h-4 w-4 text-indigo-500 dark:text-indigo-400" /> : 
            <ChevronRight className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          }
        </div>
      </button>
      <div className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {initialContent}
        </p>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400">
            {expandedContent}
          </div>
        )}
      </div>
    </div>
  );
};

// This is the main mission tab component
const MissionTabContent = ({ navigateToAppSection }) => {
  // I've removed all API endpoint references and mock data
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Mission Statement - Sophisticated Design */}
      <div className="px-6 py-8 mb-2 rounded-xl bg-gradient-to-r from-gray-50/90 to-gray-100/90 dark:from-gray-800/50 dark:to-gray-900/50 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-300 dark:to-blue-300">
          Our Mission
        </h3>
        <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200 mb-4">
           <strong>JustDAO</strong> is designed to <span className="font-semibold text-indigo-600 dark:text-indigo-300">support legal aid in underserved communities</span>. Our platform enables <span className="font-semibold text-indigo-600 dark:text-indigo-300">community-driven initiatives</span> that facilitate <i><b> legal advice, client referrals, and on-going representation </b></i> between pro bono legal aid providers and individuals in need.
        </p>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        
          <p className="text-base text-gray-800 dark:text-gray-200">
            <i>Our mission is to protect human rights by engaging service providers committed to dismantling systemic barriers and ensuring equitable access to legal support for communities impacted by poverty, discrimination, and injustice. </i>
          </p>
        </div>
      </div>

      <div className="space-y-12 py-6">
        {/* Problem Statement Section - Cleaner design with more spacing */}
        <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
          <div className="px-8 py-8">
            <div className="flex items-center space-x-4 mb-2">

              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white"> <strong>The Divide:</strong> Unequal Access to Legal Representation</h2>
            </div>
            
            <div className="bg-white/70 dark:bg-gray-800/40 rounded-lg p-6 mb-4 backdrop-blur-sm border border-gray-100 dark:border-gray-800/50">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2"><i>Critical Challenge</i></h3>
              <p className="text-gray-600 dark:text-gray-300">
              Millions of Americans face life-altering legal problems without the resources to secure proper legal guidance or representation. This creates a <strong>divide</strong> in our justice system which exacerbates inequality for vulnerable populations.              </p>
            </div>
            
            {/* Key Barriers Grid - More spacious */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
              <div className="bg-white/70 dark:bg-gray-800/40 rounded-lg p-6 backdrop-blur-sm border border-gray-100 dark:border-gray-800/50">
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-medium text-rose-600 dark:text-rose-400">Funding Shortfalls </h3>
                  <CircleDollarSign className=" h-5 w-5 text-rose-600 dark:text-rose-400 mr-3 mx-3" />

                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Traditional legal aid systems are chronically underfunded and understaffed, leaving vast community needs unmet.
                </p>
                <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="text-rose-600 dark:text-rose-400 mr-2 mt-1 flex-shrink-0">•</span>
                    <span>Inadequate resources for vulnerable populations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-rose-600 dark:text-rose-400 mr-2 mt-1 flex-shrink-0">•</span>
                    <span>Slow response to emerging community legal challenges</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-rose-600 dark:text-rose-400 mr-2 mt-1 flex-shrink-0">•</span>
                    <span>Inequitable distribution across regions and communities</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white/70 dark:bg-gray-800/40 rounded-lg p-6 backdrop-blur-sm border border-gray-100 dark:border-gray-800/50">
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-medium text-amber-600 dark:text-amber-400 ">Systemic Inequities</h3>
                  <Split className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 mx-3" />

                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Access to legal resources is marked by significant structural barriers:
                </p>
                <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="text-amber-600 dark:text-amber-400 mr-2 mt-1 flex-shrink-0">•</span>
                    <span>Geographic disparities leaving rural communities without support</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-600 dark:text-amber-400 mr-2 mt-1 flex-shrink-0">•</span>
                    <span>Opaque funding processes disconnected from community needs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-600 dark:text-amber-400 mr-2 mt-1 flex-shrink-0">•</span>
                    <span>Inefficient allocation of limited resources</span>
                  </li>
                </ul>
              </div>
            </div>
     {/* COLLAPSIBLE SECTION 1: Unaddressed Legal Issues */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
  <div className="md:col-span-2 bg-white/70 dark:bg-gray-800/40 rounded-lg p-6 backdrop-blur-sm border border-gray-100 dark:border-gray-800/50 mb-4">
    <div className="flex items-center mb-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white"> <i>Unaddressed Legal Issues</i></h3>

    </div>
    
    <p className="text-gray-600 dark:text-gray-400 mb-4">
    Many legal needs go unmet due to inherent limitations in service delivery—outdated technology, weak community outreach, and gaps in expertise limit the help available to people where they live.   </p>
    
    <div className="space-y-4">
      <LegalIssueCard 
        number="1"
        title="Public Benefits Access"
        color="red"
        initialContent="Individuals often encounter significant obstacles when attempting to secure critical benefits like SNAP, TANF, and disability support."
        expandedContent={
          <div className="space-y-3">
            <p>The application process for public benefits can be overwhelming, with complex paperwork, strict deadlines, and confusing eligibility requirements that create unnecessary barriers for those most in need.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Over 20% of eligible individuals never receive the benefits they qualify for due to procedural barriers</li>
              <li>Many benefits programs require extensive documentation that disadvantaged applicants struggle to provide</li>
              <li>Appeals processes for denied benefits are complex and often require legal expertise rarely available to low-income individuals</li>
            </ul>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              SSDI claimants are up to 93.8% more likely to win their case when represented by an attorney compared to those who go unrepresented. {' '}
              <a 
                href="https://web.archive.org/web/20250411043433/https://www.nickortizlaw.com/win-rates-for-unrepresented-claimants-vs-attorney-represented-claimants/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 text-blue-600 hover:text-blue-800 inline-block" />
              </a>
            </p>
          </div>
        }
      />
      <LegalIssueCard 
        number="2"
        title="End of Life Planning"
        color="amber"
        initialContent="Many individuals below the federal poverty guideline cannot access help with wills and healthcare directives."
        expandedContent={
          <div className="space-y-3">
            <p>End-of-life legal planning remains inaccessible for many low-income individuals, leaving families vulnerable during times of crisis and illness.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Without advance healthcare directives, critical medical decisions may not align with patient wishes</li>
              <li>Intestate succession laws often create complex family disputes and can dispossess intended beneficiaries</li>
              <li>Healthcare powers of attorney are essential for ensuring proper care but remain inaccessible to many</li>
            </ul>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              Basic estate planning documents cost an average of $1,500 through private attorneys, making them prohibitively expensive for low-income families.{' '}
              <a 
                href="https://web.archive.org/web/20250117112958/https://www.ocelderlaw.com/how-much-does-estate-planning-cost/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 text-blue-600 hover:text-blue-800 inline-block" />
              </a>
            </p>
          </div>
        }
      />
      
      <LegalIssueCard 
        number="3"
        title="Barriers to Reentry"
        color="rose"
        initialContent="People often struggle to navigate the complexities of sealing records."
        expandedContent={
          <div className="space-y-3">
            <p>Record expungement and sealing processes remain byzantine and inaccessible, creating permanent barriers to housing, employment, and education for those with past justice involvement.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Eligibility requirements vary dramatically between jurisdictions, creating confusion</li>
              <li>Filing fees and court costs create financial barriers for those most in need of record relief</li>
              <li>Even eligible individuals struggle with the complex paperwork and procedural requirements</li>
            </ul>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              Studies show expunged records can boost quarterly wages by 23%, demonstrating the individual economic impact of legal aid.{' '}
              <a 
                href="https://web.archive.org/web/20240819122120/https://pillars.taylor.edu/cgi/viewcontent.cgi?article=1016&context=luxetfidesjournal" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 text-blue-600 hover:text-blue-800 inline-block" />
              </a>
            </p>
          </div>
        }
      />
      
      <LegalIssueCard 
        number="4"
        title="Housing Justice"
        color="purple"
        initialContent="Many tenants face proceedings without representation, while landlords typically have counsel."
        expandedContent={
          <div className="space-y-3">
            <p>The representation divide in housing court creates a fundamentally unbalanced system where unrepresented tenants face experienced attorneys, leading to preventable evictions and homelessness.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>In many urban housing courts, over 90% of landlords have legal representation compared to less than 10% of tenants</li>
              <li>Represented tenants are 80% less likely to receive an eviction judgment</li>
              <li>Housing conditions cases require technical knowledge of building codes that most tenants lack</li>
            </ul>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              For every $1 spent on eviction defense, communities save an estimated $2.72 in shelter, emergency room, and other social services costs.{' '}
              <a 
                href="https://web.archive.org/web/20250411051402/https://www.alrp.org/news/alrp-eviction-defense-collaborative-co-sponsor-subway-ad-campaign/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 text-blue-600 hover:text-blue-800 inline-block" />
              </a>
            </p>
          </div>
        }
      />
    </div>
  </div>
</div>
          </div>
        </div>
        
        {/* COLLAPSIBLE SECTION 2: The Human Cost of Legal Aid Shortfalls */}
        <div className="bg-white/70 dark:bg-gray-800/40 rounded-lg p-6 backdrop-blur-sm border border-gray-100 dark:border-gray-800/50 col-span-2">
          <div className="flex items-center mb-4">
            <h3 className="text-xl font-medium text-red-600 dark:text-red-400 ">The Human Cost of Legal Aid Shortfalls</h3>
            <PersonStanding className="h-6 w-6 text-red-600 dark:text-red-400 mr-3 mx-3" />

          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-5">
            Without legal representation, fundamental rights are at risk. The justice divide creates profound consequences for individuals and communities:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <HumanCostCard title="Housing Insecurity">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                 <strong><p className="mb-2">Lack of legal support leaves families vulnerable to wrongful evictions and unsafe living conditions.</p></strong> 
                  <p className="mt-2">When facing eviction proceedings without representation:</p>
                </div>
                <div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Families often have less than 30 days to find new housing</li>
                    <li>Children experience disrupted education, often changing schools mid-year</li>
                    <li>Eviction records create long-term barriers to future housing, even when cases lack merit</li>
                  </ul>
                  <p className="text-xs italic mt-3">A single eviction can trigger a cascade of crises including homelessness, job loss, and deteriorating health outcomes.</p>
                </div>
              </div>
            </HumanCostCard>
            
            <HumanCostCard title="Family Separation">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="mb-2">Without legal protection, parents risk losing child custody, and domestic violence survivors remain trapped in dangerous situations.</p>
                  <p className="mt-2">The consequences of inadequate legal assistance in family law matters include:</p>
                </div>
                <div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Unrepresented parents lose custody at significantly higher rates</li>
                    <li>Victims of domestic violence struggle to obtain protective orders</li>
                    <li>Complex child support and visitation arrangements often favor the represented party</li>
                  </ul>
                  <p className="text-xs italic mt-3">Legal representation in family court can mean the difference between maintaining parent-child bonds and years of traumatic separation.</p>
                </div>
              </div>
            </HumanCostCard>
            
            <HumanCostCard title="Immigration Vulnerability">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="mb-2">Individuals face potential deportation, family separation, and denial of asylum without proper legal representation.</p>
                  <p className="mt-2">The immigration system presents particular challenges for unrepresented individuals:</p>
                </div>
                <div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Asylum seekers with representation are 5x more likely to be granted protection</li>
                    <li>Complex legal forms must be completed with precision in English</li>
                    <li>Missed deadlines or procedural errors can permanently bar valid claims</li>
                  </ul>
                  <p className="text-xs italic mt-3">For those fleeing persecution, legal representation can be the difference between safety and return to life-threatening situations.</p>
                </div>
              </div>
            </HumanCostCard>
            
            <HumanCostCard title="Financial Exploitation">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="mb-2">Predatory lending, wage theft, and financial fraud exploit those without legal recourse, perpetuating cycles of poverty.</p>
                  <p className="mt-2">Without access to legal assistance, vulnerable individuals face:</p>
                </div>
                <div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Inability to contest improper debt collection practices</li>
                    <li>Limited options when facing predatory loans with interest rates exceeding 400%</li>
                    <li>No recourse for recovering stolen wages, which amount to billions annually</li>
                  </ul>
                  <p className="text-xs italic mt-3">Financial exploitation disproportionately targets the elderly, immigrants, and those with limited financial literacy.</p>
                </div>
              </div>
            </HumanCostCard>
            
            <HumanCostCard title="Employment Discrimination">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="mb-2">Workers endure discrimination, unsafe conditions, and wrongful termination without means to challenge these violations.</p>
                  <p className="mt-2">Employment law violations often go unchallenged due to legal barriers:</p>
                </div>
                <div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Complex filing deadlines and administrative prerequisites create procedural traps</li>
                    <li>Documentation requirements favor employers with legal resources</li>
                    <li>Retaliation concerns prevent many from asserting their rights without legal protection</li>
                  </ul>
                  <p className="text-xs italic mt-3">Employment discrimination cases require specialized legal knowledge that makes self-representation nearly impractical.</p>
                </div>
              </div>
            </HumanCostCard>
            
            <HumanCostCard title="Benefits Denial">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="mb-2">Critical social safety net benefits are denied due to complex procedures and lack of legal guidance.</p>
                  <p className="mt-2">Access to safety net programs is often blocked by procedural barriers:</p>
                </div>
                <div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Disability benefits applications have initial denial rates exceeding 70%</li>
                    <li>Appeals processes involve complex legal and medical standards</li>
                    <li>Eligibility redeterminations can abruptly terminate benefits without clear explanation</li>
                  </ul>
                  <p className="text-xs italic mt-3">For those with disabilities or chronic illness, benefits denials can mean loss of healthcare, housing, and basic subsistence.</p>
                </div>
              </div>
            </HumanCostCard>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800/80">
            <h4 className="text-gray-800 dark:text-gray-200 font-medium mb-2 flex items-center">
              Long-Term Social Impact
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              The justice divide creates broader societal challenges:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start">
                <span className="mr-2 text-red-500 dark:text-red-400 mt-0.5">•</span>
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Perpetuated Poverty Cycles:</span> Legal issues left unresolved become financial barriers that last for generations
                </span>
              </div>
              <div className="flex items-start">
                <span className="mr-2 text-red-500 dark:text-red-400 mt-0.5">•</span>
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Community Destabilization:</span> Housing insecurity disrupts families and damages neighborhood cohesion
                </span>
              </div>
              <div className="flex items-start">
                <span className="mr-2 text-red-500 dark:text-red-400 mt-0.5">•</span>
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Decreased Civic Engagement:</span> Disenfranchisement and disillusionment with legal systems
                </span>
              </div>
              <div className="flex items-start">
                <span className="mr-2 text-red-500 dark:text-red-400 mt-0.5">•</span>
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Eroded Trust in Institutions:</span> Perception of a two-tiered justice system divided by economic status
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-5 text-center">
            <p className="text-gray-600 dark:text-gray-400 italic max-w-2xl mx-auto">
              "Equal justice under law is not merely a caption on the facade of the Supreme Court building. It is perhaps the most inspiring ideal of our society... but it remains an accomplishment to be pursued." — Justice Lewis Powell Jr.
            </p>
          </div>
        </div>
        
        {/* Solution Section - More elegant and spacious */}
        <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
          <div className="px-8 py-8">
            <div className="flex items-center space-x-4 mb-2">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Bridging the Justice <strong> Divide: </strong> Fair and Equal Legal Advocacy Access</h2>
            </div>
            
            <div className="bg-white/70 dark:bg-gray-800/40 rounded-lg p-6 mb-4 backdrop-blur-sm border border-gray-100 dark:border-gray-800/50">
              <h3 className="text-lg font-medium text-indigo-600 dark:text-indigo-400 mb-2"><i>Our Approach...</i></h3>
              <p className="text-gray-700 dark:text-gray-300">
                 <strong>JustDAO</strong>  leverages blockchain technology to provide a new funding model for legal aid providers, creating a transparent, community-driven platform that helps direct financial resources to organizations serving those with legal needs.
              </p>
            </div>
            
            {/* Solutions Grid - More spacious */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
              <div className="bg-white/70 dark:bg-gray-800/40 rounded-lg p-6 backdrop-blur-sm border border-gray-100 dark:border-gray-800/50">
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-medium text-green-500 dark:text-green-400">Addressing Resource Shortfalls</h3>
                  <CircleDollarSign className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 mx-3" />

                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                   <strong>JustDAO</strong>  directly tackles the lack of resources for legal aid through:
                </p>
                <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="text-green-500 dark:text-green-400 mr-2 mt-1 flex-shrink-0">•</span>
                    <span>Community-driven provider and case criteria selection</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 dark:text-green-400 mr-2 mt-1 flex-shrink-0">•</span>
                    <span>Transparent, real-time funding mechanisms</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 dark:text-green-400 mr-2 mt-1 flex-shrink-0">•</span>
                    <span>Community-prioritized response channels for time-sensitive legal challenges</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white/70 dark:bg-gray-800/40 rounded-lg p-6 backdrop-blur-sm border border-gray-100 dark:border-gray-800/50">
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-medium text-blue-500 dark:text-blue-400">Dismantling Systemic Inequities</h3>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-3 mx-3 lucide lucide-spline-pointer-icon lucide-spline-pointer"><path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/><path d="M5 17A12 12 0 0 1 17 5"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/></svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Our platform resolves critical systemic challenges by:
                </p>
                <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="text-blue-500 dark:text-blue-400 mr-2 mt-1 flex-shrink-0">•</span>
                    <span>Eliminating geographic funding disparities</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 dark:text-blue-400 mr-2 mt-1 flex-shrink-0">•</span>
                    <span>Creating transparent, community-guided funding processes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 dark:text-blue-400 mr-2 mt-1 flex-shrink-0">•</span>
                    <span>Optimizing resource allocation through decentralized governance</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* COLLAPSIBLE SECTION 3: How JustDAO Helps Support Legal Aid */}
            <div className="bg-white/70 dark:bg-gray-800/40 rounded-lg p-6 backdrop-blur-sm border border-gray-100 dark:border-gray-800/50">
              <div className="flex items-center mb-4">
               <i><h3 className="text-lg font-medium text-gray-900 dark:text-white">How the DAO Supports Legal Aid</h3></i>
				</div>
				<p className="text-gray-600 dark:text-gray-400 mb-4">
				  While <strong>JustDAO</strong> does not provide direct legal assistance, our platform—including a public-facing forum—serves as a bridge between individuals and legal aid providers. We empower legal organizations and advocates to deliver:
				</p>

              
              <div className="space-y-4">
                <SupportCard 
                  title="Family Law Assistance" 
                  icon={Users}
                  initialContent="Support with protective orders, divorce judgments, custody agreements, and legal guardianships."
                  expandedContent={
                    <div className="space-y-2">
                      <strong><p>JustDAO helps fill critical service gaps in family law matters by supporting providers that:</p></strong>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Offer emergency legal representation for domestic violence survivors</li>
                        <li>Guide parents through custody proceedings with child-centered advocacy</li>
                        <li>Focus on mediation or other dispute resolution methods without costly litigation</li>
                        <li>Assist with guardianship arrangements for children and vulnerable adults</li>
                      </ul>
                      <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded text-xs">
                        <strong>Impact Highlight:</strong> In communities with strong family law legal aid services, protective order completion rates increase by over 60%, dramatically improving safety outcomes for survivors and their children.
                      </div>
                    </div>
                  }
                />
                
                <SupportCard 
                  title="Landlord/Tenant Services" 
                  icon={Home}
                  initialContent="Legal representation in landlord-tenant disputes, eviction proceedings and enforcement of habitability standards."
                  expandedContent={
                    <div className="space-y-2">
                    <strong>  <p>Housing security initiatives prioritized through JustDAO governance include:</p></strong>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Rapid response fund for eviction defense</li>
                        <li>Fair housing advocacy to combat discrimination in rental markets</li>
                        <li>Support for community workshops on tenant rights and responsibilities</li>
                      </ul>
                      <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded text-xs">
                        <strong>Impact Highlight:</strong> Legal representation in eviction proceedings reduces displacement rates by up to 77%, helping maintain community stability and preventing homelessness.
                      </div>
                    </div>
                  }
                />
                
                <SupportCard 
                  title="Record Expungement Initiatives" 
                  icon={FileLock}
                  initialContent="Funding for legal aid providers working to expunge or seal eligible criminal records in state courts"
                  expandedContent={
                    <div className="space-y-2">
                   <strong>   <p>Record relief programs supported by JustDAO deliver transformative second chances through:</p>  </strong> 
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Mass expungement clinics offering efficient record clearing for eligible individuals</li>
                        <li>Specialized assistance for complex cases requiring individual advocacy</li>
                        <li>Partnerships with workforce development programs to translate record relief into economic opportunity</li>
                        <li>Policy advocacy to expand record-clearing eligibility and streamline procedures</li>
                      </ul>
                      <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded text-xs">
                        <strong>Impact Highlight:</strong> Participants in record expungement programs see average wage increases of 25% within one year as employment barriers are removed.
                      </div>
                    </div>
                  }
                />
                
                <SupportCard 
                  title="Public Benefits Advocacy" 
                  icon={CircleDollarSign}
                  initialContent="Support for legal advocacy regarding public benefits including SNAP, TANF, and disability benefits"
                  expandedContent={
                    <div className="space-y-2">
                      <strong>   <p>Benefits access programs funded through JustDAO governance include:</p>  </strong> 
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Application assistance for complex benefits systems like SSDI and SSI</li>
                        <li>Administrative hearing representation for benefits denials and terminations</li>
                        <li>Systemic advocacy to address common procedural barriers across agencies</li>
                        <li>Specialized support for veterans seeking VA benefits and healthcare access</li>
                      </ul>
                      <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded text-xs">
                        <strong>Impact Highlight:</strong> Legal representation in disability benefits cases increases approval rates from approximately 30% to over 60%, providing sustainable income for those unable to work.
                      </div>
                    </div>
                  }
                />
              </div>
              
              <p className="text-xs italic text-gray-500 dark:text-gray-400 mt-3 text-center">
                Note: JustDAO only provides support for independent legal aid providers and does not offer legal services or legal advice directly.
              </p>
            </div>
            
            <div className="bg-white/70 dark:bg-gray-800/40 rounded-lg p-6 backdrop-blur-sm border border-gray-100 dark:border-gray-800/50">
              <div className="flex items-center mb-4">
                <Landmark className="h-5 w-5 text-purple-500 dark:text-purple-400 mr-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">How We're Different</h3>
              </div>
              <div className="space-y-5">
                <div className="flex">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mr-4 border border-purple-100 dark:border-purple-900/30">
                    <TrendingUp className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">Direct community governance</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Empowering stakeholders to make meaningful decisions</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mr-4 border border-purple-100 dark:border-purple-900/30">
                    <BarChart4 className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">Full transparency</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Enables trust, accountability and efficient resource utilization</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mr-4 border border-purple-100 dark:border-purple-900/30">
                    <Coins className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">Minimal administrative overhead</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">More resources directed to frontline legal services</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Vision Statement - Better readability */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-indigo-100 dark:border-indigo-900/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 opacity-50"></div>
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-blue-500 dark:from-indigo-400 dark:to-blue-400"></div>
            <div className="relative">
              <div className="flex items-center mb-2">
                <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">A Vision of More Accessible Justice</h3>
              </div>
              <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
              At <strong>JustDAO</strong>, we believe that access to civil legal support should be available to anyone who needs it—not limited by income, geography, or other barriers. We are building a platform that connects individuals with trusted legal aid providers, expanding the reach of justice through technology and community-driven governance.
              </p>
            </div>
          </div>
        </div>
        
        {/* Removed all the Upcoming Initiatives section that was using external data */}
      </div>
    </div>
  );
};

export default MissionTabContent;